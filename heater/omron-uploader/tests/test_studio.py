import sys, unittest, tempfile, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from program_model import Programme,Segment,ValidationError,encode_time,decode_time,planned_writes
from compoway import encode_request,parse_response,bcc,ProtocolError,SerialClient
from transfer import TransferSession,PreflightError,PREFLIGHT
from backup_explorer import decode_slot,load_backup,profile_points,config_explanation,summary_as_plaintext,DecodeError
from offline_creator import prepare_html,local_copy


class FakeDevice:
    def __init__(self):
        self.data={k:0 for k in []}
        self.blocks=[[0]*150 for _ in range(8)]
        self.c3={k:v[0] for k,v in PREFLIGHT.items()}
        self.wait_raw=0
        self.model="E5CC-TQX3A";self.running=False;self.write_allowed=True
        self.operations=[];self.nonvolatile_saves=0
        self.inject_fault=None
    def identify(self):return {"model10":self.model,"buffer_bytes":217}
    def status(self):return "0000" if self.running else "0100"
    def read(self,kind,addr,count=1):
        if kind=="C3":return [self.c3[addr+i] for i in range(count)]
        if kind=="C1":return [self.wait_raw if addr+i==0x0021 else 0 for i in range(count)]
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

class ExplorerTests(unittest.TestCase):
    def example(self, input_type=5):
        # Two segments: 50 °C at 2 °C/min, 15 min soak. Second stored memory.
        regs = [0]*150
        regs[0]=2
        regs[0x0E]=0
        regs[0x0F]=0xFFFFFFFF
        regs[0x16]=0
        regs[0x17]=50 if input_type==5 else 500
        regs[0x18]=2
        regs[0x1A]=1
        regs[0x1D]=0x15
        bank = {str(i):["00000000"]*150 for i in range(8)}
        bank["1"]=[f"{x:08X}" for x in regs]
        return {"schema":"e5cct-backup-1",
                "controller":{"model10":"E5CC-TQX3A"},
                "status":"0100",
                "preflight":{"C3:0000":input_type,"C3:0004":0,"C3:00B9":0,
                             "C3:00BA":1,"C3:00BB":0,"C3:00BC":0,
                             "C3:00BD":1,"C3:00BE":0,"C3:00BF":0},
                "programmes":bank}
    def test_realistic_50_degree_programme_and_curve(self):
        obj=self.example(5)
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"captured.json"
            p.write_text(json.dumps(obj),encoding="utf-8")
            captured=load_backup(p)
        program=decode_slot(captured,1)
        self.assertEqual(program["count"],2)
        self.assertFalse(program["warnings"])
        self.assertIn("50 °C", program["segments"][0]["description"])
        self.assertIn("15 min", program["segments"][1]["description"])
        self.assertEqual(program["repeat_text"],"No repetition")
        self.assertEqual(program["link_text"],"No chaining")
        self.assertEqual(profile_points(program,20.0),[(0.0,20.0),(15.0,50.0),(30.0,50.0)])
        self.assertIn("SP Start",summary_as_plaintext(program))
        self.assertIn("whole-degree display",config_explanation(obj)[0]["meaning"])
    def test_type6_scales_temperature_tenths(self):
        program=decode_slot(self.example(6),1)
        self.assertEqual(program["segments"][0]["sp"],50.0)
        self.assertEqual(profile_points(program,20)[-1],(30.0,50.0))
    def test_step_segment_from_device(self):
        obj=self.example(5)
        obj["programmes"]["1"][0x1A]="00000002"
        obj["programmes"]["1"][0x1B]="00000028"
        dec=decode_slot(obj,1)
        self.assertEqual(dec["segments"][1]["type"],"step")
        self.assertEqual(dec["segments"][1]["sp"],40)
        self.assertEqual(profile_points(dec,20)[-1],(15.0,40))
    def test_unknown_segment_disallows_curve(self):
        obj=self.example()
        obj["programmes"]["1"][0x1A]="00000063"
        program=decode_slot(obj,1)
        self.assertTrue(program["warnings"])
        self.assertIsNone(profile_points(program,20))
    def test_invalid_hmm_does_not_invent_soak_duration(self):
        obj=self.example()
        obj["programmes"]["1"][0x1D]="0000007F"
        program=decode_slot(obj,1)
        self.assertIsNone(program["segments"][1]["minutes"])
        self.assertIsNone(profile_points(program,20))
    def test_bad_backup_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"bad.json"
            p.write_text(json.dumps({"schema":"e5cct-backup-1","programmes":{"0":[]}}))
            self.assertRaises(DecodeError,load_backup,p)
    def test_offline_creator_uses_exact_website_html(self):
        src="\n".join(["---","layout: null","---","<!doctype html><html><body><a href=\"../omron-programming/#bench\">guide</a></body></html>"])
        text=prepare_html(src)
        self.assertTrue(text.startswith("<!doctype html>"))
        self.assertIn("OFFLINE DESKTOP EDITION",text)
        self.assertIn("https://techtinker.club/heater/omron-programming/#bench",text)
        with tempfile.TemporaryDirectory() as tmp:
            try:
                import offline_creator
                source=offline_creator.bundled_source()
            except FileNotFoundError:
                self.skipTest("Website source not present in standalone uploaded source tests")
            self.assertTrue(local_copy(tmp).is_file())

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
    def test_type5_scaling_and_precision_guard(self):
        p=Programme(steps=[Segment("ramp",sp="50",rate="2"),Segment("soak",minutes="15"),Segment("step",sp="40")])
        vals=dict(planned_writes(1,p,input_type=5))
        self.assertEqual(vals[0x0117],50)
        self.assertEqual(vals[0x011A],1)
        self.assertEqual(vals[0x011E],2)
        self.assertEqual(vals[0x011F],40)
        self.assertEqual(vals[0x0100],3)
        self.assertEqual(dict(planned_writes(1,p,input_type=6))[0x0117],500)
        with self.assertRaises(ValidationError):
            planned_writes(1,Programme(steps=[Segment("ramp",sp="50.5")]),input_type=5)
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
    def test_all_documented_variable_banks_read_only(self):
        # The extended catalogue must not be silently blocked at protocol layer.
        client=SerialClient.__new__(SerialClient)
        client.write_allowed=False
        calls=[]
        def fake_query(cmd):
            calls.append(cmd)
            return "0000002A"
        client.query=fake_query
        for bank in ("DA","C0","C1","C3","C4","C5","C9"):
            self.assertEqual(client.read(bank,0,1),[42])
            self.assertEqual(calls[-1],f"0101{bank}0000000001")
        self.assertRaises(ValueError,client.read,"ZZ",0,1)
        self.assertRaises(PermissionError,client.write1,0,42)
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
    def test_communications_write_off_only_after_saved_receipt(self):
        device=FakeDevice()
        session=TransferSession(device)
        session.preflight()
        with self.assertRaises(PreflightError):
            session.disable_communications_writing()
        self.assertNotIn(("00","00"),device.operations)
        with tempfile.TemporaryDirectory() as folder:
            session.backup(folder)
            session.stage(0,Programme())
            with self.assertRaises(PreflightError):
                session.disable_communications_writing()
            self.assertNotIn(("00","00"),device.operations)
            session.commit()
            self.assertTrue(session.disable_communications_writing())
            self.assertEqual(device.operations[-1],("00","00"))
            self.assertTrue(session.communications_write_disabled)
            self.assertEqual(device.nonvolatile_saves,1)
            with self.assertRaises(PreflightError):
                session.disable_communications_writing()

    def test_backup_reports_progress_and_verifies_file_on_disk(self):
        d=FakeDevice();s=TransferSession(d)
        s.preflight()
        completed=[]
        with tempfile.TemporaryDirectory() as folder:
            path=s.backup(folder,progress=lambda n,total:completed.append((n,total)))
            self.assertEqual(completed,[(i,8) for i in range(1,9)])
            self.assertEqual(s.backup_file,path)
            stored=json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(stored["schema"],"e5cct-backup-1")
            self.assertEqual(len(stored["programmes"]),8)
            self.assertEqual(sum(len(v) for v in stored["programmes"].values()),1200)
            self.assertEqual(len(stored["preflight"]),9)
            self.assertEqual(s.backup_data,stored)
            self.assertEqual(d.operations,[])  # pure read-only; no uploads
    def test_short_read_invalidates_backup_and_disallows_plan(self):
        d=FakeDevice();s=TransferSession(d)
        s.preflight()
        with tempfile.TemporaryDirectory() as folder:
            s.backup(folder)
            self.assertIsNotNone(s.backup_data)
            # A new failed attempt must not leave the prior backup usable.
            original_read=d.read
            def short_da_read(kind,addr,count=1):
                data=original_read(kind,addr,count)
                if kind=="DA" and addr==0x0100:
                    return data[:-1]  # emulate a 24-register return for a 25-register request
                return data
            d.read=short_da_read
            self.assertRaises(ProtocolError,s.backup,folder)
            self.assertIsNone(s.backup_data)
            self.assertIsNone(s.backup_file)
            self.assertRaises(PreflightError,s.build_plan,0,Programme())
            self.assertEqual(d.operations,[])
    def test_preflight_mismatch_allows_backup_but_blocks_writes(self):
        d=FakeDevice();d.c3[0x00BF]=1;s=TransferSession(d)
        report=s.preflight();self.assertTrue(report["mismatches"])
        with tempfile.TemporaryDirectory() as dir:
            self.assertTrue(s.backup(dir).exists())
            self.assertRaises(PreflightError,s.build_plan,0,Programme())
            self.assertEqual(d.operations,[])
    def test_model_mismatch_refuses(self):
        d=FakeDevice();d.model="E5AC-TCX4A";s=TransferSession(d)
        self.assertRaises(PreflightError,s.preflight)
    def test_step_preview_and_stage_require_live_global_wait(self):
        d=FakeDevice();s=TransferSession(d);s.preflight()
        p=Programme(steps=[Segment("step",sp="120"),Segment("soak",minutes="15")])
        with tempfile.TemporaryDirectory() as folder:
            s.backup(folder)
            with self.assertRaisesRegex(PreflightError,"Wait Band"):
                s.build_plan(0,p)
            self.assertEqual(d.operations,[])
            d.wait_raw=30
            self.assertTrue(s.build_plan(0,p))
            staged=s.stage(0,p)
            self.assertEqual(staged["slot"],0)
            self.assertEqual(d.nonvolatile_saves,0)
            self.assertIn(("04","01"),d.operations)
    def test_step_fails_closed_if_wait_cannot_be_read(self):
        d=FakeDevice();s=TransferSession(d);s.preflight()
        p=Programme(steps=[Segment("step",sp="120")])
        with tempfile.TemporaryDirectory() as folder:
            s.backup(folder)
            old=d.read1
            def fail(bank,addr):
                if bank=="C1" and addr==0x0021:raise OSError("simulated USB timeout")
                return old(bank,addr)
            d.read1=fail
            with self.assertRaisesRegex(PreflightError,"live read"):
                s.build_plan(0,p)
            self.assertEqual(d.operations,[])

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
