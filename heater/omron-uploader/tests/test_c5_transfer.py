"""Fixed C5 PID-set writes are independent, read back, and do not touch DA."""
from __future__ import annotations
import tempfile,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from transfer import TransferSession,PREFLIGHT,PreflightError
from c5_transfer import C5PIDTransfer,check_value,verify_c5_receipt
from compoway import SerialClient,ProtocolError

class Fake:
    write_allowed=True
    def __init__(self):
        self.c3={address:pair[0] for address,pair in PREFLIGHT.items()}
        self.c3.update({0x0005:1300,0x0006:0xFFFFFF38,0x0007:1,0x0008:0})
        self.c5={i:0 for i in range(128)}
        for i in range(8):
            self.c5[i*16]=100
            self.c5[i*16+3]=1000
            self.c5[i*16+4]=0
        self.da=[[0]*150 for _ in range(8)]
        self.calls=[]
        self.closed=False
    def identify(self):return {"model10":"E5CC-TQX3A","buffer_bytes":217}
    def status(self):return "0100"
    def read(self,bank,address,count=1):
        if bank=="DA":return self.da[address>>8][(address&255):((address&255)+count)]
        if bank=="C3":return [self.c3.get(address+i,0) for i in range(count)]
        if bank=="C5":return [self.c5.get(address+i,0) for i in range(count)]
        raise AssertionError(bank)
    def read1(self,bank,address):return self.read(bank,address)[0]
    def operation(self,code,data):self.calls.append(("operation",code,data))
    def write_setting(self,bank,address,value):
        assert bank=="C5"
        check_value(f"C5:{address:04X}",value)
        self.calls.append(("write",bank,address,value))
        self.c5[address]=value

class C5Tests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.client=Fake()
        self.ses=TransferSession(self.client)
        self.ses.preflight()
        self.ses.backup(self.tmp.name)
        self.tx=C5PIDTransfer(self.client,self.ses,self.tmp.name)
    def tearDown(self):self.tmp.cleanup()

    def test_only_selected_fixed_pid_registers_written_and_saved(self):
        before=[list(x) for x in self.client.da]
        changes={"C5:0000":150,"C5:0010":220}
        self.assertEqual(len(self.tx.preview(changes)["changes"]),2)
        self.assertEqual(self.client.calls,[])
        self.assertEqual(self.tx.stage(),2)
        self.assertEqual(self.client.c5[0],150)
        self.assertEqual(self.client.c5[16],220)
        receipt=self.tx.save_finish()
        self.assertEqual(verify_c5_receipt(self.client,receipt,self.ses.info["model10"]),2)
        self.assertTrue(self.tx.cmw_off)
        self.assertEqual(self.client.da,before)
        self.assertEqual([x for x in self.client.calls if x[0]=="write"],
                         [("write","C5",0,150),("write","C5",16,220)])
        self.assertEqual(self.client.calls.count(("operation","05","00")),1)

    def test_cooling_pid_requires_cooling_mode(self):
        with self.assertRaisesRegex(PreflightError,"Cooling PID"):
            self.tx.preview({"C5:0008":150})
        self.assertEqual(self.client.calls,[])

    def test_invalid_set_and_limits_rejected_before_communications_write(self):
        for draft in ({"C5:0005":100},{"C5:0000":0},{"C5:0004":1100},
                      {"C5:0003":100,"C5:0004":200}):
            with self.assertRaises(PreflightError):self.tx.preview(draft)
            self.assertEqual(self.client.calls,[])

    def test_mode_change_after_preview_rejected(self):
        self.tx.preview({"C5:0000":150})
        self.client.c3[0x0007]=0
        with self.assertRaisesRegex(PreflightError,"PID control mode"):
            self.tx.stage()
        self.assertFalse(self.tx.ram_touched)

    def test_receipt_detects_changed_value(self):
        self.tx.preview({"C5:0000":150})
        self.tx.stage()
        receipt=self.tx.save_finish()
        self.client.c5[0]=100
        with self.assertRaises(ProtocolError):
            verify_c5_receipt(self.client,receipt,self.ses.info["model10"])

    def test_serial_writer_is_allowlisted(self):
        client=SerialClient.__new__(SerialClient)
        client.write_allowed=True
        sent=[]
        client.query=lambda packet:sent.append(packet) or ""
        client.write_setting("C5",0,150)
        self.assertEqual(sent,["0102C5000000000100000096"])
        with self.assertRaises(PermissionError):
            client.write_setting("C5",5,120)
        with self.assertRaises(ValueError):
            client.write_setting("C5",0,0)

if __name__=="__main__":unittest.main()
