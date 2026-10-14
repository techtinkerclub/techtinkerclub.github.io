"""Non-writing regression contracts for setup-area-aware E5CC parameter plans."""
from __future__ import annotations
import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from controller_inventory import offline_inventory
from parameter_write_plan import requirements, create_write_plan

class WritePlanTests(unittest.TestCase):
    def setUp(self):
        self.inv=offline_inventory()

    def test_area_and_persistence_not_interchangeable(self):
        self.assertEqual(requirements("C1:0021").area,"0")
        self.assertEqual(requirements("C3:0000").area,"1")
        self.assertEqual(requirements("C5:0000").persistence,"SAVE RAM DATA")
        self.assertNotEqual(requirements("C3:0000").persistence,"SAVE RAM DATA")

    def test_wait_band_and_explicit_programme_eligible_as_one_pilot(self):
        plan=create_write_plan(self.inv,{"C1:0021":20},
                               programme_changed=True,include_programme=True)
        self.assertTrue(plan["combined_qualified"])
        self.assertTrue(plan["all_changes_usb_writable"])
        self.assertEqual(plan["setting_area_1"],[])
        self.assertEqual(plan["setting_area_0"],["C1:0021"])

    def test_sensor_type_and_wait_band_with_programme_blocked(self):
        plan=create_write_plan(self.inv,{"C1:0021":20,"C3:0000":6},
                               programme_changed=True,include_programme=True)
        self.assertFalse(plan["combined_qualified"])
        self.assertFalse(plan["all_changes_usb_writable"])
        self.assertEqual(plan["setting_area_1"],["C3:0000"])
        self.assertIn("Sensor input",plan["parameters"][1]["reason"])

    def test_initial_setup_alone_stays_unqualified(self):
        plan=create_write_plan(self.inv,{"C3:0000":6})
        self.assertEqual(len(plan["blocked"]),1)
        self.assertEqual(plan["blocked"][0]["setting_area"],"1")

    def test_read_only_and_protection_password_never_eligible(self):
        for key in ("C0:0000","C1:0029"):
            self.assertFalse(requirements(key).allowed_in_current_app)

    def test_all_proposals_remain_visible(self):
        keys={"C1:0021":20,"C3:0000":6,"C5:0000":200}
        plan=create_write_plan(self.inv,keys)
        self.assertEqual(len(plan["parameters"]),3)
        self.assertEqual({row["register"] for row in plan["parameters"]},set(keys))

    def test_bad_inputs_fail_closed(self):
        with self.assertRaises(ValueError):
            create_write_plan(self.inv,{"C3:FFFF":6})
        with self.assertRaises(ValueError):
            create_write_plan(self.inv,{"C3:0000":-1})
        with self.assertRaises(ValueError):
            create_write_plan(self.inv,{"C1:0021":20},include_programme=True)

if __name__=="__main__":unittest.main()
