"""Hardware-free tests for selected E5CC C1 adjustment USB writer."""
import sys
import json
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from transfer import TransferSession,PREFLIGHT,PreflightError
from c1_transfer import C1SettingsTransfer,C1_SPECS,check_value,verify_c1_receipt
from compoway import ProtocolError

class Fake:
    write_allowed=True
    def __init__(self):
        self.c3={addr:expected for addr,(expected,_) in PREFLIGHT.items()}
        self.c3[0x0007]=1   # PID
        self.c1={0x0015:120,0x0016:100,0x0017:40,0x001B:20,0x0021:10}
        self.pid=1
        self.da=[[0]*150 for _ in range(8)]
        self.calls=[]
        self.fail_on=None
        self.c5_mismatch=False
    def identify(self):return {"model10":"E5CC-TQX3A","buffer_bytes":217}
    def status(self):return "0100"
    def read(self,bank,address,count=1):
        if bank=="DA":return self.da[address>>8][address&255:(address&255)+count]
        if bank=="C3":return [self.c3.get(address+i,0) for i in range(count)]
        if bank=="C1":return [self.c1.get(address+i,0) for i in range(count)]
        if bank=="C0" and address==0x000D:return [self.pid]
        if bank=="C5":
            return [self.c1[{0:0x0015,1:0x0016,2:0x0017}[address+i]]+(1 if self.c5_mismatch else 0)
                    if (address+i)//0x10==self.pid-1 and (address+i)%0x10 in (0,1,2)
                    else 0 for i in range(count)]
        raise AssertionError(f"Unsupported read {bank} {address:04X}")
    def read1(self,bank,address):return self.read(bank,address,1)[0]
    def write_setting(self,bank,address,value):
        if ("write",address)==self.fail_on:
            raise RuntimeError("Injected write failure")
        assert bank=="C1" and f"C1:{address:04X}" in C1_SPECS
        self.calls.append(("write",bank,address,value))
        self.c1[address]=value
    def operation(self,code,data):
        if ("operation",code,data)==self.fail_on:
            raise RuntimeError("Injected operation failure")
        self.calls.append(("operation",code,data))

class C1WriterTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.client=Fake()
        self.ses=TransferSession(self.client)
        self.ses.preflight()
        self.ses.backup(self.tmp.name)
        self.tx=C1SettingsTransfer(self.client,self.ses,self.tmp.name)
    def tearDown(self):self.tmp.cleanup()

    def test_one_save_for_multiple_pid_settings(self):
        plan=self.tx.preview({"C1:0015":135,"C1:0016":120,"C1:0021":25})
        self.assertEqual(len(plan["changes"]),3)
        self.assertTrue(self.tx.baseline_file.is_file())
        self.assertFalse(self.client.calls)
        self.assertEqual(self.tx.stage(),3)
        self.assertTrue(self.ses.ram_touched)
        receipt=self.tx.save_finish()
        self.assertTrue(receipt.is_file())
        self.assertTrue(self.tx.cmw_off)
        self.assertFalse(self.ses.ram_touched)
        self.assertEqual([x for x in self.client.calls if x[0]=="operation"],
                         [("operation","00","01"),("operation","04","01"),
                          ("operation","05","00"),("operation","00","00")])
        self.assertEqual(verify_c1_receipt(self.client,receipt,self.ses.info["model10"]),3)

    def test_wrong_mode_does_not_write(self):
        self.client.c3[0x0007]=0
        with self.assertRaisesRegex(PreflightError,"PID"):
            self.tx.preview({"C1:0015":135})
        self.assertFalse(self.client.calls)
        self.client.c3[0x0007]=1
        with self.assertRaisesRegex(PreflightError,"ON/OFF"):
            self.tx.preview({"C1:001B":25})
        self.assertFalse(self.client.calls)

    def test_hysteresis_in_on_off_mode(self):
        self.client.c3[0x0007]=0
        self.tx.preview({"C1:001B":25,"C1:0021":20})
        self.tx.stage()
        self.assertEqual(self.client.c1[0x001B],25)
        self.tx.save_finish()

    def test_changed_pid_set_refuses_stage_before_writing(self):
        self.tx.preview({"C1:0015":130})
        self.client.pid=2
        with self.assertRaisesRegex(PreflightError,"PID set changed"):
            self.tx.stage()
        self.assertFalse(self.tx.ram_touched)
        self.assertFalse(self.client.calls)

    def test_pid_c1_and_fixed_c5_mismatch_blocks_before_write(self):
        self.client.c5_mismatch=True
        with self.assertRaisesRegex(PreflightError,"fixed C5"):
            self.tx.preview({"C1:0015":130})
        self.assertFalse(self.tx.ram_touched)
        self.assertFalse(self.client.calls)

    def test_changed_live_baseline_refuses_stage(self):
        self.tx.preview({"C1:0015":130})
        self.client.c1[0x0015]=121
        with self.assertRaisesRegex(ProtocolError,"old_raw"):
            self.tx.stage()
        self.assertFalse(self.client.calls)

    def test_mid_sequence_failure_never_saves_or_disables_cmw(self):
        self.tx.preview({"C1:0015":135,"C1:0016":120})
        self.client.fail_on=("write",0x0016)
        with self.assertRaisesRegex(RuntimeError,"Injected write"):
            self.tx.stage()
        self.assertTrue(self.tx.ram_touched)
        self.assertTrue(self.ses.ram_touched)
        self.assertNotIn(("operation","05","00"),self.client.calls)
        self.assertNotIn(("operation","00","00"),self.client.calls)
        with self.assertRaises(PreflightError):
            self.tx.save_finish()

    def test_cmw_off_failure_does_not_issue_second_save(self):
        self.tx.preview({"C1:0015":135})
        self.tx.stage()
        self.client.fail_on=("operation","00","00")
        with self.assertRaisesRegex(RuntimeError,"Injected operation"):
            self.tx.save_finish()
        self.assertTrue(self.tx.saved)
        self.assertFalse(self.tx.cmw_off)
        self.assertTrue(self.tx.receipt_file.is_file())
        with self.assertRaises(PreflightError):
            self.tx.save_finish()
        self.assertEqual(self.client.calls.count(("operation","05","00")),1)

    def test_unsupported_and_out_of_range_fails_closed(self):
        for key,value in [("C3:0000",5),("C1:0022",500),("C1:0015",0),
                          ("C1:0015",10000),("C1:0015",-1)]:
            with self.assertRaises(PreflightError):
                check_value(key,value)
        with self.assertRaises(PreflightError):
            self.tx.preview({"C3:0000":5})
        self.assertFalse(self.client.calls)

    def test_receipt_checks_every_register(self):
        self.tx.preview({"C1:0015":130,"C1:0016":120})
        self.tx.stage()
        receipt=self.tx.save_finish()
        self.client.c1[0x0016]=110
        with self.assertRaises(ProtocolError):
            verify_c1_receipt(self.client,receipt,self.ses.info["model10"])
        with self.assertRaises(PreflightError):
            verify_c1_receipt(self.client,receipt,"Different-model")

if __name__=="__main__":unittest.main()
