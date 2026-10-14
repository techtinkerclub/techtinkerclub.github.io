"""USB-prefix versus nameplate-verified hardware feature contracts."""
from __future__ import annotations
import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from hardware_profile import confirm_model,required_feature,supports,permitted
from controller_inventory import SENSOR_INPUTS
from c3_transfer import check_setting,PreflightError

class ModelCapabilitiesTests(unittest.TestCase):
    def setUp(self):
        self.prefix="E5CC-TQX3A"
        self.basic=confirm_model("E5CC-TQX3A5M-000",self.prefix)
        self.rs485=confirm_model("E5CC-TQX3A5M-003",self.prefix)

    def test_usb_prefix_is_not_enough_to_select_suffix(self):
        with self.assertRaisesRegex(ValueError,"nameplate"):
            confirm_model("E5CC-TQX3A",self.prefix)
        with self.assertRaisesRegex(ValueError,"prefix"):
            confirm_model("E5CC-TQX3D5M-003",self.prefix)

    def test_outputs_aux_communications_and_ct_are_variant_specific(self):
        self.assertEqual(self.basic.auxiliary_count,3)
        self.assertEqual(self.basic.output1,"voltage pulse")
        self.assertIsNone(self.basic.output2)
        self.assertFalse(supports(self.basic,"C3:0010"))
        self.assertTrue(supports(self.rs485,"C3:0010"))
        self.assertFalse(supports(self.basic,"C1:000D"))
        self.assertTrue(supports(self.rs485,"C1:000D"))
        self.assertTrue(supports(self.basic,"C3:0056"))
        self.assertFalse(supports(self.basic,"C3:004F"))
        self.assertFalse(supports(self.basic,"C3:0084"))

    def test_event_and_transfer_option_suffixes(self):
        evt=confirm_model("E5CC-TQX3A5M-001",self.prefix)
        self.assertTrue(supports(evt,"C3:0016"))
        self.assertTrue(supports(evt,"C3:0017"))
        self.assertFalse(supports(evt,"C3:0018"))
        self.assertFalse(supports(self.rs485,"C3:0016"))
        trans=confirm_model("E5CC-TQX3A5M-006",self.prefix)
        self.assertTrue(supports(trans,"C3:003E"))
        self.assertFalse(supports(self.basic,"C3:003E"))

    def test_unknown_options_never_become_writable_by_readability(self):
        self.assertIsNone(supports(None,"C3:0016"))
        self.assertFalse(permitted(None,"C3:0016",1))
        self.assertFalse(permitted(self.basic,"C3:0016",1))
        self.assertFalse(permitted(self.rs485,"C3:0010",None))
        self.assertTrue(permitted(self.rs485,"C3:0010",3))

    def test_all_thirty_documented_sensor_codes_encode_without_da(self):
        self.assertEqual(set(SENSOR_INPUTS),set(range(30)))
        for sensor in range(30):
            self.assertEqual(check_setting("C3:0000",sensor),sensor)
        with self.assertRaises(PreflightError):check_setting("C3:0000",30)

    def test_invalid_hardware_combinations_refused(self):
        with self.assertRaises(ValueError):
            confirm_model("E5CC-TCX3A5M-003","E5CC-TCX3A")
        with self.assertRaises(ValueError):
            confirm_model("E5CC-TQX3A5M-XYZ",self.prefix)
        self.assertIsNone(required_feature("C3:0000"))

if __name__=="__main__":unittest.main()
