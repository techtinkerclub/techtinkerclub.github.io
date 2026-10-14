"""C3 setup-area-1 write safety tests; NO physical serial access."""
from __future__ import annotations
import json,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from transfer import TransferSession,PreflightError,PREFLIGHT
from c3_transfer import C3ConfigurationTransfer,check_setting,verify_c3_receipt
from compoway import SerialClient,ProtocolError

class Fake:
    write_allowed=True
    def __init__(self,blank=False):
        self.c3={addr:val for addr,(val,_) in PREFLIGHT.items()}
        self.c3.update({5:1300,6:0xffffff38,7:0,0x0a:1})
        self.da=[[0]*150 for _ in range(8)]
        if not blank:
            for slot in self.da:
                slot[0]=1;slot[0x16]=0;slot[0x17]=80
        self.calls=[];self.area=0;self.fail=None
    def identify(self):return {"model10":"E5CC-TQX3A","buffer_bytes":217}
    def status(self):return "0100"
    def read(self,bank,addr,count=1):
        if bank=="DA":return self.da[addr>>8][(addr&255):((addr&255)+count)]
        if bank=="C3":return [self.c3.get(addr+i,0) for i in range(count)]
        raise AssertionError("Unsupported bank "+bank)
    def read1(self,bank,addr):return self.read(bank,addr,1)[0]
    def operation(self,code,data):
        if self.fail==("op",code,data):raise RuntimeError("Injected operation failure")
        if (code,data)==("07","00"):self.area=1
        if (code,data)==("00","00"):pass
        self.calls.append(("operation",code,data))
    def write_setting(self,bank,addr,value):
        if self.fail==("write",addr):raise RuntimeError("Injected write failure")
        assert bank=="C3" and self.area==1
        check_setting(f"C3:{addr:04X}",value)
        self.calls.append(("write",bank,addr,value))
        self.c3[addr]=value

class C3Tests(unittest.TestCase):
    def setup(self,blank=False):
        self.tmp=tempfile.TemporaryDirectory()
        self.client=Fake(blank=blank)
        self.ses=TransferSession(self.client)
        self.ses.preflight()
        self.ses.backup(self.tmp.name)
        self.tx=C3ConfigurationTransfer(self.client,self.ses,self.tmp.name)
    def tearDown(self):
        if hasattr(self,"tmp"):self.tmp.cleanup()

    def test_algorithm_and_period_one_area1_session_without_save_or_software_reset(self):
        self.setup()
        prev=self.tx.preview({"C3:0007":1,"C3:000A":2})
        self.assertEqual(len(prev["changes"]),2)
        self.assertEqual(self.client.calls,[])
        self.assertEqual(self.tx.stage(),2)
        self.assertEqual(self.client.c3[7],1)
        self.assertTrue(self.tx.staged)
        receipt=self.tx.finish()
        self.assertTrue(receipt.is_file())
        self.assertTrue(self.tx.cmw_off)
        self.assertEqual([c for c in self.client.calls if c[0]=="operation"],
                         [("operation","00","01"),("operation","07","00"),
                          ("operation","00","00")])
        self.assertEqual(verify_c3_receipt(self.client,receipt,self.ses.info["model10"]),2)
        self.assertNotIn(("operation","05","00"),self.client.calls)
        self.assertNotIn(("operation","06","00"),self.client.calls)

    def test_sensor_change_with_populated_memory_allowed_and_backed_up(self):
        self.setup(blank=False)
        doc=self.tx.preview({"C3:0000":6})
        self.assertTrue(doc["sensor_change"])
        self.assertEqual(doc["changes"][0]["register"],"C3:0000")
        self.assertEqual(self.client.calls,[])
        self.assertEqual(self.tx.stage(),1)
        receipt=self.tx.finish()
        stored=json.loads(receipt.read_text(encoding="utf-8"))
        self.assertEqual(len(stored["original_programmes"]),8)
        self.assertEqual(stored["original_programmes"]["0"][0],"00000001")
        self.assertTrue(stored["programme_audit_available"])
        self.assertEqual(stored["write_scope"],"C3-only, no DA register writes")
        self.assertNotIn(("operation","06","00"),self.client.calls)

    def test_sensor_only_write_does_not_modify_any_programme_register(self):
        self.setup(blank=False)
        from copy import deepcopy
        before=deepcopy(self.client.da)
        preview=self.tx.preview({"C3:0000":6})
        self.assertEqual([row["register"] for row in preview["changes"]],
                         ["C3:0000"])
        self.tx.stage()
        self.tx.finish()
        self.assertEqual(self.client.da,before)
        self.assertEqual([call for call in self.client.calls if call[0]=="write"],
                         [("write","C3",0,6)])
        self.assertEqual(self.client.c3[0],6)

    def test_c3_edit_not_blocked_by_unrelated_programme_method_defaults(self):
        self.setup()
        # A normal manual front-panel mode change is permitted even if the
        # stored programme slope/time mode differs from our DA editor preset.
        self.client.c3[0x00BA]=0
        self.client.c3[0x00BB]=1
        self.tx.preview({"C3:0007":1})
        self.tx.stage()
        self.assertEqual(self.client.c3[7],1)

    def test_c3_rejects_incompatible_sp_limit_before_area_entry(self):
        self.setup()
        with self.assertRaisesRegex(PreflightError,"SP limits"):
            self.tx.preview({"C3:0005":5000})
        self.assertEqual(self.client.calls,[])

    def test_sensor_change_blank_memory_has_exact_bounds(self):
        self.setup(blank=True)
        proposal={"C3:0000":6,"C3:0005":5000,"C3:0006":0xffffff38}
        self.tx.preview(proposal)
        self.tx.stage()
        self.tx.finish()
        self.assertEqual(self.client.c3[0],6)
        self.assertEqual(self.client.c3[5],5000)
        self.assertEqual(self.client.c3[6],0xffffff38)
        follow=TransferSession(self.client)
        follow.preflight()
        self.assertFalse(follow.mismatches)

    def test_unsupported_sensor_or_register_never_written(self):
        self.setup()
        for props in ({"C3:0000":7},{"C3:000D":1},{"C3:000A":0xfffffffd}):
            with self.assertRaises(PreflightError):self.tx.preview(props)
        self.assertEqual(self.client.calls,[])
        client=SerialClient.__new__(SerialClient)
        client.write_allowed=True
        calls=[]
        client.query=lambda cmd:calls.append(cmd) or ""
        client.write_setting("C3",7,1)
        client.write_setting("C3",0x0a,0xfffffffe)
        self.assertEqual(calls,[
            "0102C3000700000100000001",
            "0102C3000A000001FFFFFFFE"])
        with self.assertRaises(PermissionError):
            client.write_setting("C3",0x000D,1)
        with self.assertRaises(ValueError):
            client.write_setting("C3",0,29)

    def test_partial_write_never_claims_completed_or_disables_cmw(self):
        self.setup()
        self.tx.preview({"C3:0007":1,"C3:000A":2})
        self.client.fail=("write",7)
        with self.assertRaisesRegex(RuntimeError,"Injected write"):
            self.tx.stage()
        self.assertTrue(self.tx.area_entered)
        self.assertFalse(self.tx.staged)
        self.assertFalse(self.tx.cmw_off)
        self.assertFalse(any(c==("operation","00","00") for c in self.client.calls))
        with self.assertRaises(PreflightError):self.tx.stage()

    def test_wrong_receipt_and_incorrect_readback_detected(self):
        self.setup()
        self.tx.preview({"C3:0007":1})
        self.tx.stage()
        path=self.tx.finish()
        self.client.c3[7]=0
        with self.assertRaises(ProtocolError):
            verify_c3_receipt(self.client,path,self.ses.info["model10"])
        with self.assertRaises(PreflightError):
            verify_c3_receipt(self.client,path,"Different")

    def test_no_hidden_mixed_area1_and_adjustment_writes(self):
        self.setup()
        with self.assertRaises(PreflightError):
            self.tx.preview({"C3:0007":1,"C1:0021":20})
        self.assertEqual(self.client.calls,[])

if __name__=="__main__":unittest.main()
