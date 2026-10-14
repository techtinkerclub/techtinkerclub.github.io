"""Read-only prerequisite links for controller setting editor."""
import unittest
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from setting_dependencies import dependency_for

class TestSettingDependencies(unittest.TestCase):
    def test_pid_requires_current_controller_pid_not_just_local_proposal(self):
        d=dependency_for("C1:0015",{"C3:0007":0},{"C3:0007":1})
        self.assertEqual(d.register,"C3:0007")
        self.assertFalse(d.matches_controller)
        self.assertIn("not yet USB-writable",d.explanation)

    def test_proposed_conflict_is_reported_even_if_controller_is_pid(self):
        d=dependency_for("C1:0016",{"C3:0007":1},{"C3:0007":0})
        self.assertTrue(d.proposed_conflict)
        self.assertIn("proposal conflicts",d.explanation)

    def test_heating_hysteresis_requires_on_off(self):
        d=dependency_for("C1:001B",{"C3:0007":1})
        self.assertEqual(d.required,0)
        self.assertIn("ON/OFF",d.explanation)

    def test_unrelated_register_has_no_dependency(self):
        self.assertIsNone(dependency_for("C1:0021",{"C3:0007":1}))
if __name__=="__main__":unittest.main()
