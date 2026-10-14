"""Hardware-free combined transaction tests. No physical serial writes."""
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from combined_transfer import CombinedTransfer, verify_combined_receipt
from transfer import TransferSession, PREFLIGHT
from program_model import Programme, Segment

class Fake:
    write_allowed = True
    def __init__(self):
        self.calls=[]
        self.c3={addr:value for addr,(value,_) in PREFLIGHT.items()}
        self.c1={0x0021:0}
        self.da=[[0]*150 for _ in range(8)]
        for block in self.da:
            block[0]=1
            block[0x0e]=0
            block[0x0f]=0xffffffff
            block[0x16]=0
            block[0x17]=50
            block[0x18]=0
        self.fail_da = False
        self.fail_cmw_off = False
    def identify(self):
        return {"model10":"E5CC-TQX3A","buffer_bytes":217}
    def status(self):
        return "0100"
    def read(self,bank,addr,count=1):
        if bank=="C3": return [self.c3.get(addr+i,0) for i in range(count)]
        if bank=="C1": return [self.c1.get(addr+i,0) for i in range(count)]
        if bank=="DA":
            return self.da[addr>>8][(addr&255):(addr&255)+count]
        raise AssertionError("Unapproved bank")
    def read1(self,bank,addr):
        return self.read(bank,addr,1)[0]
    def write_setting(self,bank,addr,value):
        assert (bank,addr)==("C1",0x0021)
        self.c1[addr]=value
        self.calls.append(("write-setting",bank,addr,value))
    def write1(self,addr,value):
        if self.fail_da:
            raise RuntimeError("DA write simulated failure")
        self.da[addr>>8][addr&255]=value
        self.calls.append(("write-da",addr,value))
    def operation(self,code,data):
        if (code,data)==("00","00") and self.fail_cmw_off:
            raise RuntimeError("CMW OFF simulated failure")
        assert (code,data) in {("00","00"),("00","01"),("04","01"),("05","00")}
        self.calls.append(("operation",code,data))

class CombinedTests(unittest.TestCase):
    def setUp(self):
        self.dir=tempfile.TemporaryDirectory()
        self.client=Fake()
        self.ses=TransferSession(self.client)
        self.ses.preflight()
        self.ses.backup(self.dir.name)
        self.programme=Programme(name="Test programme",start="20",finish="rst",
            steps=[Segment("ramp",sp="50",rate="2"),
                   Segment("soak",minutes="2"),
                   Segment("ramp",sp="20",rate="2")])
        self.tx=CombinedTransfer(self.client,self.ses,self.dir.name)
    def tearDown(self):
        self.dir.cleanup()
    def test_single_save_both_c1_and_da(self):
        data=self.tx.preview(0,self.programme,20)
        self.assertGreater(len(data["programme_changes"]),0)
        self.tx.stage()
        self.assertTrue(self.tx.staged)
        self.assertFalse(self.tx.saved)
        receipt=self.tx.save_finish()
        self.assertTrue(receipt.is_file())
        self.assertTrue(self.tx.cmw_off)
        self.assertFalse(self.ses.ram_touched)
        ops=[c for c in self.client.calls if c[0]=="operation"]
        self.assertEqual(ops,[("operation","00","01"),("operation","04","01"),
                              ("operation","05","00"),("operation","00","00")])
        self.assertEqual(verify_combined_receipt(self.client,receipt,"E5CC-TQX3A"),
                         len(data["programme_changes"])+1)
    def test_failure_during_da_write_must_not_save_or_cmw_off(self):
        self.tx.preview(0,self.programme,20)
        self.client.fail_da=True
        with self.assertRaisesRegex(RuntimeError,"DA write"):
            self.tx.stage()
        self.assertTrue(self.tx.ram_touched)
        self.assertTrue(self.ses.ram_touched)
        self.assertFalse(self.tx.staged)
        self.assertNotIn(("operation","05","00"),self.client.calls)
        self.assertNotIn(("operation","00","00"),self.client.calls)
    def test_cmw_off_error_cannot_repeat_save(self):
        self.tx.preview(0,self.programme,20)
        self.tx.stage()
        self.client.fail_cmw_off=True
        with self.assertRaisesRegex(RuntimeError,"CMW OFF"):
            self.tx.save_finish()
        self.assertTrue(self.tx.saved)
        self.assertTrue(self.tx.receipt_file.is_file())
        with self.assertRaises(Exception):
            self.tx.save_finish()
        self.assertEqual(self.client.calls.count(("operation","05","00")),1)
    def test_tampered_baseline_refused_before_any_write(self):
        self.tx.preview(0,self.programme,20)
        self.tx.baseline_file.write_text("{}",encoding="utf-8")
        with self.assertRaises(Exception):
            self.tx.stage()
        self.assertFalse(self.tx.ram_touched)
        self.assertFalse(any(c[0]=="operation" for c in self.client.calls))
    def test_step_programme_validated_against_joint_wait(self):
        self.programme.steps=[Segment("step",sp="40")]
        self.tx.preview(0,self.programme,20)
        with self.assertRaises(Exception):
            other=CombinedTransfer(self.client,self.ses,self.dir.name)
            other.preview(0,self.programme,0)

if __name__=="__main__":
    unittest.main()
