"""No-hardware regression tests for controller setup read-only inspection."""
import sys, unittest, tempfile, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from controller_setup import (CONFIG, SCHEMA, PLAN_SCHEMA, read_snapshot,
                              validate_snapshot, apply_draft, build_proposal,
                              value_text, report, write_new_json)

class FakeReadOnly:
    def __init__(self):
        self.reads=[]
        self.writes=[]
        self.values={
            "C3:0000":5, "C3:0004":0, "C3:0005":1300, "C3:0006":0xFFFFFF38,
            "C3:0007":1, "C3:0008":0, "C3:000A":2, "C3:000C":0,
            "C3:000D":2, "C3:000E":0,
            "C3:00B9":0,"C3:00BA":1,"C3:00BB":0,
            "C3:00BC":0,"C3:00BD":1,"C3:00BE":0,"C3:00BF":0,
            "C1:0022":0,"C1:0023":0
        }
    def read1(self,kind,addr):
        name=f"{kind}:{addr:04X}"
        self.reads.append(name)
        if name not in self.values: raise RuntimeError("Option not fitted")
        return self.values[name]
    def write1(self,*args):self.writes.append(args);raise AssertionError("UNEXPECTED WRITE")
    def operation(self,*args):self.writes.append(args);raise AssertionError("UNEXPECTED OPERATION")

class SetupTests(unittest.TestCase):
    def make_snapshot(self):
        device=FakeReadOnly()
        identity={"model10":"E5CC-TQX3A","buffer_bytes":217}
        prior={"C3:0000":5,"C3:0004":0}
        return device,read_snapshot(device,identity,prior)
    def test_realistic_snapshot_meanings_and_no_writes(self):
        device,snap=self.make_snapshot()
        self.assertEqual(snap["schema"],SCHEMA)
        self.assertEqual(snap["fields"]["C3:00BF"],0)
        self.assertEqual(snap["fields"]["C3:0000"],5)
        self.assertEqual(value_text("C3:0000",5),"Type K, −200 to 1300 °C, 1 °C resolution")
        self.assertIn("SP Start",value_text("C3:00BF",0))
        self.assertIn("Reverse",value_text("C3:000C",0))
        self.assertIn("2 seconds",value_text("C3:000A",2))
        self.assertIn("-20.0%",value_text("C1:0022",0xFFFFFF38))
        self.assertNotIn("C3:0000",device.reads)
        self.assertEqual(device.writes,[])
        self.assertIsNone(snap["fields"]["C3:000F"])
        self.assertIn("C3:000F",snap["errors"])
        self.assertIn("unavailable",report(snap).lower())
    def test_offline_plan_is_separate_and_no_writes(self):
        device,snap=self.make_snapshot()
        draft=apply_draft(snap,{},"C3:00BF",1)
        draft=apply_draft(snap,draft,"C3:0007",0)
        self.assertEqual(snap["fields"]["C3:00BF"],0)
        self.assertEqual(set(draft),{"C3:00BF","C3:0007"})
        proposal=build_proposal(snap,draft)
        self.assertEqual(proposal["schema"],PLAN_SCHEMA)
        self.assertFalse(proposal["controller_writes_performed"])
        self.assertEqual(len(proposal["proposed_changes"]),2)
        self.assertEqual(device.writes,[])
        self.assertNotIn("C3:00BF",apply_draft(snap,draft,"C3:00BF",0))
    def test_invalid_drafts_fail_closed(self):
        _,snap=self.make_snapshot()
        with self.assertRaises(ValueError):apply_draft(snap,{},"C3:0005",500)
        with self.assertRaises(ValueError):apply_draft(snap,{},"C3:000F",1)
        with self.assertRaises(ValueError):apply_draft(snap,{},"C3:00BF",99)
        with self.assertRaises(ValueError):apply_draft(snap,{},"C3:00BF",True)
        with self.assertRaises(ValueError):build_proposal(snap,{"DA:0000":9})
        with self.assertRaises(ValueError):validate_snapshot({"schema":SCHEMA,"controller":{"model10":"DIFFERENT"},"fields":{"C3:00BA":1}})
        with self.assertRaises(ValueError):validate_snapshot({"schema":SCHEMA,"controller":{"model10":"E5CC-TQX3A"},"fields":{"C3:00BA":True}})
    def test_saved_snapshot_reopen_verification_and_no_overwrite(self):
        _,snap=self.make_snapshot()
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/"setup.json"
            write_new_json(path,snap)
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")),snap)
            with self.assertRaises(FileExistsError):write_new_json(path,{"evil":"overwrite"})
            self.assertEqual(json.loads(path.read_text(encoding="utf-8")),snap)

if __name__=="__main__":unittest.main()
