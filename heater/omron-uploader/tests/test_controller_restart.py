"""One-shot software restart, full audit and no-response protocol tests."""
from __future__ import annotations
import json,sys,tempfile,threading,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from compoway import SerialClient,encode_request,ProtocolError
from controller_restart import restart_and_audit
from transfer import TransferSession,PreflightError
from test_c3_transfer import Fake
from programme_audit import compare_programmes

class Wire:
    def __init__(self,short=False):
        self.written=[];self.flushed=0;self.short=short
    def reset_input_buffer(self):pass
    def write(self,data):
        self.written.append(data)
        return len(data)-1 if self.short else len(data)
    def flush(self):self.flushed+=1
    def read(self,size):raise AssertionError("Software reset MUST NOT wait for a response")

class ResetFake(Fake):
    def __init__(self):
        super().__init__(blank=False)
        self.resets=0
        self.closed=False
        self.reboot_changes=[]
    def software_reset(self):
        self.resets+=1
        self.area=0
        for slot,offset,new in self.reboot_changes:
            self.da[slot][offset]=new
        self.c3[0x0005]=5000 if self.c3[0]==6 else 1300
    def close(self):self.closed=True

class TestRestartAndAudit(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.client=ResetFake()
        self.ses=TransferSession(self.client)
        self.ses.preflight()
        self.ses.backup(self.tmp.name)
        from c3_transfer import C3ConfigurationTransfer
        self.tx=C3ConfigurationTransfer(self.client,self.ses,self.tmp.name)
        self.tx.preview({"C3:0000":6})
        self.tx.stage()
        self.tx.finish()
    def tearDown(self):self.tmp.cleanup()

    def test_reset_and_full_audit_populated_memory(self):
        self.client.reboot_changes=[(2,0x17,440)]
        clients=[]
        def factory(port,write_allowed=False):
            self.assertEqual(port,"COM7")
            self.assertFalse(write_allowed)
            clients.append(self.client)
            self.client.closed=False
            return self.client
        new,report=restart_and_audit(self.tx,"COM7",factory,self.tmp.name,
                                     retry_delay=0,timeout_seconds=1)
        self.assertIs(new,self.client)
        self.assertEqual(self.client.resets,1)
        self.assertEqual(report["memory_words_compared"],1200)
        self.assertEqual(report["changes_total"],1)
        self.assertEqual(report["changes_by_programme"]["2"],1)
        self.assertTrue(report["configuration_verified"])
        self.assertTrue(report["requires_manual_review"])
        self.assertGreaterEqual(report["configuration_side_effects"],1)
        self.assertIn("C3:0005",[row["register"] for row in report["unrequested_global_changes"]])
        self.assertTrue(Path(report["audit_file"]).is_file())
        saved=json.loads(Path(report["audit_file"]).read_text(encoding="utf-8"))
        self.assertEqual(saved["differences"][0]["register"],"DA:0217")
        self.assertEqual(len(saved["current_programmes"]),8)
        with self.assertRaisesRegex(PreflightError,"already attempted"):
            restart_and_audit(self.tx,"COM7",factory,self.tmp.name)
        self.assertEqual(self.client.resets,1)

    def test_unchanged_raw_temperature_is_reinterpreted_tenfold(self):
        from programme_audit import interpreted_temperature_changes
        before={str(i):["00000000"]*150 for i in range(8)}
        after={str(i):["00000000"]*150 for i in range(8)}
        before["0"][0]=after["0"][0]="00000001"
        before["0"][0x16]=after["0"][0x16]="00000000"  # ramp
        before["0"][0x17]=after["0"][0x17]="00000078"  # 120 in raw
        differences,issues=interpreted_temperature_changes(before,after,5,6)
        self.assertFalse(issues)
        self.assertEqual(len(differences),1)
        self.assertEqual(differences[0]["old_interpretation_c"],120)
        self.assertEqual(differences[0]["new_interpretation_c"],12)
        self.assertEqual(differences[0]["raw_before"],differences[0]["raw_after"])

    def test_no_raw_da_changes_still_flags_sensor_interpretation(self):
        self.client.reboot_changes=[]
        _,report=restart_and_audit(
            self.tx,"COM7",lambda p,write_allowed=False:self.client,
            self.tmp.name,timeout_seconds=1)
        self.assertEqual(report["changes_total"],0)
        self.assertTrue(report["requires_manual_review"])
        self.assertIn("STILL",report["assessment"])
        self.assertGreater(report["possible_interpretation_change_count"],0)
        self.assertFalse(report["interpretation_is_verified_on_hardware"])

    def test_reset_refused_before_cmw_off(self):
        self.tx.cmw_off=False
        with self.assertRaisesRegex(PreflightError,"CMW OFF"):
            restart_and_audit(self.tx,"COM7",lambda *args,**kwargs:self.client,self.tmp.name)
        self.assertEqual(self.client.resets,0)

    def test_software_reset_sends_once_and_never_reads(self):
        wire=Wire()
        client=SerialClient.__new__(SerialClient)
        client.serial=wire;client.node=1
        client.lock=threading.RLock();client.write_allowed=True
        self.assertIsNone(client.software_reset())
        self.assertEqual(wire.written,[encode_request("30050600",1)])
        self.assertEqual(wire.flushed,1)
        client.write_allowed=False
        with self.assertRaises(PermissionError):
            client.software_reset()
        self.assertEqual(len(wire.written),1)

    def test_short_serial_write_never_retries(self):
        wire=Wire(short=True)
        client=SerialClient.__new__(SerialClient)
        client.serial=wire;client.node=1
        client.lock=threading.RLock();client.write_allowed=True
        with self.assertRaisesRegex(ProtocolError,"uncertain"):
            client.software_reset()
        self.assertEqual(len(wire.written),1)

if __name__=="__main__":unittest.main()
