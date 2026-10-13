"""Controller change review is an offline audit, never a generic register writer."""
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from controller_inventory import offline_inventory,CATALOG
from config_change_review import build_review,classify_parameter,readable_review,SCHEMA

class ReviewTests(unittest.TestCase):
    def test_restricted_controller_area_not_confused_with_da_save(self):
        snap=offline_inventory()
        review=build_review(snap,{"C3:0000":5,"C5:0000":255,"C3:0010":1},
                             selected_slot=0)
        self.assertEqual(review["schema"],SCHEMA)
        self.assertTrue(review["summary"]["programme_write_locked_by_config_draft"])
        self.assertEqual(review["summary"]["count"],3)
        self.assertGreater(review["summary"]["high_risk"],0)
        self.assertTrue(all(not c["approved_for_hardware_write"] for c in review["changes"]))
        self.assertIn("setting area 1",next(c for c in review["changes"] if c["register"]=="C3:0000")["required_setting_area"])
        self.assertIn("PID set",next(c for c in review["changes"] if c["register"]=="C5:0000")["required_setting_area"])
        self.assertIn("C3/C9",review["warning"])
        self.assertIn("NO WRITES",readable_review(review))
    def test_monitor_and_contextual_programme_not_generically_writable(self):
        self.assertFalse(classify_parameter("C0:0000")["can_apply"])
        self.assertFalse(classify_parameter("C4:0002")["can_apply"])
        self.assertFalse(classify_parameter("C1:0029")["can_apply"])
        self.assertIn("password",classify_parameter("C1:0029")["note"])
    def test_invalid_draft_rejected_and_empty_review(self):
        s=offline_inventory()
        with self.assertRaises(ValueError):build_review(s,{"ZZ:0000":1})
        with self.assertRaises(ValueError):build_review(s,{"C1:0015":-1})
        with self.assertRaises(ValueError):build_review(s,{"C1:0015":2**32})
        with self.assertRaises(ValueError):build_review(s,{},9)
        report=build_review(s,{},0)
        self.assertEqual(report["summary"]["count"],0)
        self.assertFalse(report["summary"]["programme_write_locked_by_config_draft"])
    def test_existing_controller_unread_baseline_rejected(self):
        s=offline_inventory()
        s.pop("mode")
        with self.assertRaises(ValueError):build_review(s,{"C3:0000":5})

if __name__=="__main__":unittest.main()
