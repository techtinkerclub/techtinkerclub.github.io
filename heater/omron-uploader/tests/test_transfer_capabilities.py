"""Safety contracts for planning current E5CC model register writes."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from transfer_capabilities import capability, transfer_plan

class CapabilityTests(unittest.TestCase):
    def test_wait_band_qualified(self):
        self.assertTrue(capability("C1:0021").hardware_writable)
    def test_sensor_initial_setting_not_yet_qualified(self):
        info=capability("C3:0000")
        self.assertFalse(info.hardware_writable)
        self.assertEqual(info.status,"qualification-required")
    def test_monitor_never_writable(self):
        self.assertEqual(capability("C0:0000").status,"read-only")
    def test_mixed_draft_no_silent_partial_write(self):
        p=transfer_plan({"C1:0021":20,"C3:0000":6},programme_changed=True)
        self.assertEqual(len(p["blocked"]),1)
        self.assertEqual(len(p["settings_eligible"]),1)
        self.assertFalse(p["can_write_all"])
        self.assertFalse(p["simultaneous_transfer_qualified"])
    def test_programme_with_wait_band_not_falsely_atomic(self):
        p=transfer_plan({"C1:0021":20},programme_changed=True)
        self.assertFalse(p["simultaneous_transfer_qualified"])
    def test_unknown_address_rejected(self):
        with self.assertRaises(ValueError):
            transfer_plan({"C3:FFFF":1})
    def test_bad_proposed_value_rejected(self):
        with self.assertRaises(ValueError):
            transfer_plan({"C1:0021":-5})

if __name__=="__main__":
    unittest.main()
