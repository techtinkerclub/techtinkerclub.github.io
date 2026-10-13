"""Tests for H186-documented full controller inventory and offline change proposals.
No real instrument is needed; all fake clients prohibit serial writes.
"""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from controller_inventory import (CATALOG,SUPPORTED_READ_TYPES,group_names,
  read_inventory,validate_inventory,readable_rows,proposal_report,
  validate_proposal,add_proposal,human_value,offline_inventory)

class ReadOnlyFake:
    def __init__(self,unavailable=None):
        self.unavailable=set(unavailable or [])
        self.read_calls=[]
        self.write_calls=[]
    def read(self,bank,addr,count=1):
        self.read_calls.append((bank,addr,count))
        if bank not in SUPPORTED_READ_TYPES:raise AssertionError("Unknown bank")
        if count>25:raise AssertionError("Exceeded Omron read limit")
        if any(f"{bank}:{i:04X}" in self.unavailable for i in range(addr,addr+count)):
            raise RuntimeError("Option or parameter not fitted")
        return [10+((addr+i)%7) for i in range(count)]
    def write1(self,*args):
        self.write_calls.append(args)
        raise AssertionError("Unexpected instrument write")
    def operation(self,*args):
        self.write_calls.append(args)
        raise AssertionError("Unexpected operation command")

class CatalogTests(unittest.TestCase):
    def test_documented_register_areas(self):
        self.assertGreater(len(CATALOG),250)
        self.assertGreater(len(group_names()),10)
        for prefix in ("C0","C1","C3","C4","C5","C9"):
            self.assertTrue(any(key.startswith(prefix+":") for key in CATALOG))
        self.assertEqual(CATALOG["C5:007C"].name,"PID 8 — Manual reset value")
        self.assertEqual(len([x for x in CATALOG if x.startswith("C5:")]),96)
        self.assertEqual(CATALOG["C3:0000"].options[5],"Type K −200…1300 °C (1 °C)")
        self.assertEqual(CATALOG["C9:0041"].name,"Download mapping 43")
    def test_full_read_is_batched_only_allowlisted_nonmutating(self):
        fake=ReadOnlyFake({"C5:0024","C3:0023"})
        progress=[]
        snapshot=read_inventory(fake,{"model10":"E5CC-TQX3A","buffer_bytes":217},
               progress=lambda n,total:progress.append((n,total)))
        self.assertEqual(snapshot["register_count"],len(CATALOG))
        self.assertEqual(snapshot["fields"]["C5:0024"],None)
        self.assertIn("C5:0024",snapshot["errors"])
        self.assertEqual(snapshot["fields"]["C3:0023"],None)
        self.assertEqual(snapshot["fields"]["C5:0010"],10+(0x10%7))
        self.assertEqual(len(snapshot["fields"]),len(CATALOG))
        self.assertEqual(progress[-1],(len(CATALOG),len(CATALOG)))
        self.assertTrue(all(1<=count<=25 for _,_,count in fake.read_calls))
        self.assertFalse(fake.write_calls)
        validate_inventory(snapshot)
        self.assertTrue(any(x["name"].startswith("PID 8") for x in readable_rows(snapshot,"PID sets / PID 8")))
    def test_selected_c4_context_and_masked_secret(self):
        fake=ReadOnlyFake()
        snap=read_inventory(fake,{"model10":"E5CC-TQX3A"})
        self.assertIn("selected programme",snap["important_notes"][0].lower())
        self.assertIn("hidden",human_value("C1:0029",0).lower())
        with self.assertRaises(ValueError):validate_proposal(snap,"C1:0029","3")
        with self.assertRaises(ValueError):validate_proposal(snap,"C4:0000","2")
        with self.assertRaises(ValueError):validate_proposal(snap,"C0:0000","100")
    def test_typed_numeric_precision_and_enum_guard(self):
        fake=ReadOnlyFake()
        snap=read_inventory(fake,{"model10":"E5CC-TQX3A"})
        self.assertEqual(validate_proposal(snap,"C5:0000","25.5"),255)
        self.assertEqual(validate_proposal(snap,"C1:0013","1.234"),1234)
        self.assertEqual(validate_proposal(snap,"C3:0000","5"),5)
        with self.assertRaises(ValueError):validate_proposal(snap,"C5:0000","25.55")
        with self.assertRaises(ValueError):validate_proposal(snap,"C3:0000","40")
        with self.assertRaises(ValueError):validate_proposal(snap,"C3:0000","NaN")
        with self.assertRaises(ValueError):validate_proposal(snap,"C5:0000","-1")
    def test_offline_full_catalogue_does_not_invent_values(self):
        snapshot=offline_inventory()
        self.assertEqual(len(snapshot["fields"]),len(CATALOG))
        self.assertTrue(all(v is None for v in snapshot["fields"].values()))
        self.assertEqual(snapshot["mode"],"offline")
        draft=add_proposal(snapshot,{},"C3:0000","5")
        draft=add_proposal(snapshot,draft,"C3:0005","200")
        self.assertEqual(draft["C3:0000"],5)
        self.assertEqual(draft["C3:0005"],200)
        doc=proposal_report(snapshot,draft)
        self.assertFalse(doc["writes_performed"])
        self.assertIsNone(doc["changes"][0]["previous_hex"])
        with self.assertRaises(ValueError):add_proposal(snapshot,draft,"C3:0005","2000")
    def test_temperature_encoding_for_type6(self):
        fake=ReadOnlyFake()
        snap=read_inventory(fake,{"model10":"E5CC-TQX3A"})
        snap["fields"]["C3:0000"]=6
        snap["fields"]["C3:0006"]=0
        snap["fields"]["C3:0005"]=5000
        self.assertEqual(human_value("C3:0005",5000,6),"500 °C")
        self.assertEqual(validate_proposal(snap,"C3:0005","400.5"),4005)
        with self.assertRaises(ValueError):validate_proposal(snap,"C3:0005","400.55")
    def test_draft_report_never_writes(self):
        fake=ReadOnlyFake()
        snap=read_inventory(fake,{"model10":"E5CC-TQX3A"})
        draft=add_proposal(snap,{},"C5:0000","25.5")
        result=proposal_report(snap,draft)
        self.assertFalse(result["writes_performed"])
        self.assertEqual(result["changes"][0]["proposed_hex"],"000000FF")
        self.assertEqual(result["changes"][0]["group"],"PID sets / PID 1")
        self.assertFalse(fake.write_calls)

if __name__=="__main__":unittest.main()
