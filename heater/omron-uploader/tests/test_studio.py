import sys, unittest, tempfile, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from program_model import Programme,Segment,ValidationError,encode_time,decode_time,planned_writes
from compoway import encode_request,parse_response,bcc,ProtocolError,SerialClient
from transfer import TransferSession,PreflightError,PREFLIGHT

class FakeDevice:
    def __init__(self):
        self.data={k:0 for k in []}
        self.blocks=[[0]*150 for _ in range(8)]
        self.c3={k:v[0] for k,v in PREFLIGHT.items()};self.c3[0x0000]=6
        self.model="E5CC-TQX3A";self.running=False;self.write_allowed=True
        self.operations=[];self.nonvolatile_saves=0
        self.inject_fault=None
    def identify(self):return {"model10":self.model,"buffer_bytes":217}
    def status(self):return "0000" if self.running else "0100"
    def read(self,kind,addr,count=1):
        if kind=="C3":return [self.c3[addr+i] for i in range(count)]
        if kind!="DA":raise AssertionError("unexpected read type")
        return [self.blocks[addr>>8][(addr&255)+i] for i in range(count)]
    def read1(self,kind,addr):return self.read(kind,addr,1)[0]
    def write1(self,addr,val):
        if self.inject_fault==addr:raise ProtocolError("Synthetic cable interruption")
        self.blocks[addr>>8][addr&255]=val&0xffffffff
    def operation(self,code,info):
        self.operations.append((code,info))
        if (code,info)==("05","00"):self.nonvolatile_saves+=1
        return ""

class ProgramTests(unittest.TestCase):
    def test_65_minute(self):
        a=Programme().validate();self.assertEqual(a["minutes"],65);self.assertEqual(a["final_sp"],120)
        self.assertEqual(a["points"],[(0,20),(50,120),(65,120)])
    def test_32_segment_limit(self):
        p=Programme(steps=[Segment("soak",minutes="1")]*32);self.assertEqual(p.validate()["segments"],32)
        p.steps.append(Segment("soak"));self.assertRaises(ValidationError,p.validate)
    def test_wrong_rate_range(self):
        for rate in ["0","2.5","-1","10000","nan"]:
            p=Programme(steps=[Segment("ramp",rate=rate)]);self.assertRaises(ValidationError,p.validate)
    def test_time_encoding_hhmm(self):
        cases={0:0,15:0x0015,65:0x0105,90:0x0130,5999:0x9959}
        for minutes,encoded in cases.items():
            self.assertEqual(encode_time(minutes),encoded)
            self.assertEqual(decode_time(encoded),minutes)
        self.assertRaises(ValidationError,decode_time,0x006A)
        self.assertRaises(ValidationError,encode_time,6000)
    def test_hex_address_map(self):
        pairs=dict(planned_writes(0,Programme()))
        self.assertEqual(pairs[0x0000],2)
        self.assertEqual(pairs[0x000E],0)
        self.assertEqual(pairs[0x000F],0xFFFFFFFF)
        self.assertEqual(pairs[0x0016],0)  # ramp
        self.assertEqual(pairs[0x0017],1200) # 120.0 °C
        self.assertEqual(pairs[0x0018],2)    # °C/min
        self.assertEqual(pairs[0x001A],1) # soak
        self.assertEqual(pairs[0x001D],0x15) # 0 h,15 min
        second=dict(planned_writes(7,Programme()))
        self.assertEqual(second[0x0717],1200)
    def test_site_json_import(self):
        example={"version":1,"method":"rate","programmeNumber":0,"programme":{"name":"Web", "start":20,"finish":"rst","steps":[{"type":"ramp","sp":120,"rate":2},{"type":"soak","minutes":15}]}}
        self.assertEqual(Programme.from_json(example).validate()["minutes"],65)
    def test_cont_end_blocks_upload(self):
        p=Programme(finish="cont");self.assertEqual(p.validate()["minutes"],65)

class ProtocolTests(unittest.TestCase):
    def response(self,service="0503",text="0000E5CC-TQX3A00D9"):
        body=("010000"+service+text).encode()+bytes([3]);return bytes([2])+body+bytes([bcc(body)])
    def test_request(self):
        msg=encode_request("0503");self.assertEqual(msg[:10],b"\x02010000503")
        self.assertEqual(msg[-2],3);self.assertEqual(bcc(msg[1:-1]),msg[-1])
    def test_response(self):self.assertEqual(parse_response(self.response(),"0503"),"E5CC-TQX3A00D9")
    def test_corrupted_bcc(self):
        f=self.response();self.assertRaises(ProtocolError,parse_response,f[:-1]+bytes([f[-1]^1]),"0503")
    def test_wrong_function(self):self.assertRaises(ProtocolError,parse_response,self.response(),"0101")
    def test_unknown_node(self):self.assertRaises(ProtocolError,parse_response,self.response(),"0503",2)
    def test_write_command_whitelist(self):
        obj=SerialClient.__new__(SerialClient);obj.write_allowed=True
        self.assertRaises(PermissionError,obj.operation,"01","00")
        self.assertRaises(PermissionError,obj.operation,"0B","00")
        obj.write_allowed=False
        self.assertRaises(PermissionError,obj.write1,0,1)

class TransferTests(unittest.TestCase):
    def test_full_backup_ram_stage_save(self):
        d=FakeDevice();s=TransferSession(d)
        s.preflight()
        with tempfile.TemporaryDirectory() as folder:
            path=s.backup(folder)
            backup=json.loads(Path(path).read_text(encoding="utf-8"))
            self.assertEqual(len(backup["programmes"]),8)
            self.assertEqual(len(backup["programmes"]["7"]),150)
            self.assertEqual(d.operations,[])
            plan=s.build_plan(0,Programme())
            self.assertGreater(len(plan),0)
            result=s.stage(0,Programme())
            self.assertTrue(s.ram_touched)
            self.assertEqual(d.nonvolatile_saves,0)
            self.assertTrue(s.staged)
            self.assertIn(("04","01"),d.operations)
            self.assertEqual(d.read1("DA",0x001D),0x15)
            s.commit()
            self.assertEqual(d.nonvolatile_saves,1)
            self.assertTrue(s.committed)
    def test_preflight_mismatch_allows_backup_but_blocks_writes(self):
        d=FakeDevice();d.c3[0x00BF]=0;s=TransferSession(d)
        report=s.preflight();self.assertTrue(report["mismatches"])
        with tempfile.TemporaryDirectory() as dir:
            self.assertTrue(s.backup(dir).exists())
            self.assertRaises(PreflightError,s.build_plan,0,Programme())
            self.assertEqual(d.operations,[])
    def test_model_mismatch_refuses(self):
        d=FakeDevice();d.model="E5AC-TCX4A";s=TransferSession(d)
        self.assertRaises(PreflightError,s.preflight)
    def test_running_blocks_stage(self):
        d=FakeDevice();s=TransferSession(d);s.preflight()
        with tempfile.TemporaryDirectory() as dir:s.backup(dir)
        d.running=True
        self.assertRaises(PreflightError,s.stage,0,Programme())
        self.assertEqual(d.operations,[])
    def test_cable_error_aborts_without_save(self):
        d=FakeDevice();s=TransferSession(d);s.preflight()
        with tempfile.TemporaryDirectory() as dir:s.backup(dir)
        d.inject_fault=0x0017
        self.assertRaises(ProtocolError,s.stage,0,Programme())
        self.assertTrue(s.ram_touched);self.assertEqual(d.nonvolatile_saves,0)
        self.assertIsNone(s.staged)

if __name__=="__main__":unittest.main()

# Supplemental end-to-end test: nonvolatile persistence verification receipt.
class ReceiptTests(unittest.TestCase):
    def test_replug_check_and_bad_data(self):
        d=FakeDevice();s=TransferSession(d);s.preflight()
        with tempfile.TemporaryDirectory() as folder:
            s.backup(folder)
            s.stage(0,Programme())
            receipt=s.commit()
            self.assertTrue(receipt.exists())
            # Brand new read-only session emulates disconnect/reconnect.
            r=TransferSession(d);r.preflight()
            verification=r.verify_persistence(receipt)
            self.assertTrue(verification.exists())
            d.blocks[0][0x17]=1000
            self.assertRaises(ProtocolError,r.verify_persistence,receipt)
