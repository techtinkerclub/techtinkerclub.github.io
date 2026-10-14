"""Read-only regression tests for comparing E5CC programme backups."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from backup_compare import compare_saved_backups,comparison_text

def make_backup(input_type=5,target=120,model="E5CC-TQX3A"):
    programmes={str(slot):["00000000"]*150 for slot in range(8)}
    for slot in range(8):
        programmes[str(slot)][0]="00000001"
        programmes[str(slot)][0x16]="00000000"  # ramp
        programmes[str(slot)][0x17]=f"{target:08X}"
    return {
       "schema":"e5cct-backup-1",
       "controller":{"model10":model},
       "preflight":{"C3:0000":input_type,"C3:0004":0,
                    "C3:00BA":1,"C3:00BB":0,"C3:00B9":0},
       "programmes":programmes
    }

class TestBackupCompare(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.first=Path(self.tmp.name)/"before.json"
        self.second=Path(self.tmp.name)/"after.json"
    def tearDown(self):self.tmp.cleanup()
    def compare(self,before,after):
        self.first.write_text(json.dumps(before),encoding="utf-8")
        self.second.write_text(json.dumps(after),encoding="utf-8")
        return compare_saved_backups(self.first,self.second)

    def test_same_raw_programmes_but_different_input_scale(self):
        data=self.compare(make_backup(5),make_backup(6))
        self.assertEqual(data["changed_raw_words"],0)
        self.assertEqual(data["raw_words_compared"],1200)
        self.assertEqual(len(data["interpreted_target_changes"]),8)
        self.assertEqual(data["global_settings_changes"],[
            {"register":"C3:0000","before_raw":5,"after_raw":6}])
        row=data["interpreted_target_changes"][0]
        self.assertEqual((row["old_interpretation_c"],row["new_interpretation_c"]),(120,12))
        self.assertTrue(data["requires_review"])
        summary=comparison_text(data)
        self.assertIn("120 °C -> 12 °C",summary)
        self.assertIn("0 different",summary)
        self.assertIn("NOT panel-verified",summary)

    def test_reverted_sensor_type_and_unchanged_memory(self):
        report=self.compare(make_backup(5),make_backup(5))
        self.assertEqual(report["changed_raw_words"],0)
        self.assertEqual(report["interpreted_target_changes"],[])
        self.assertEqual(report["global_settings_changes"],[])
        self.assertFalse(report["requires_review"])

    def test_actual_da_edit_is_distinguished_from_scale_change(self):
        report=self.compare(make_backup(5),make_backup(5,target=250))
        self.assertEqual(report["changed_raw_words"],8)
        self.assertEqual(len(report["interpreted_target_changes"]),8)
        self.assertEqual(report["raw_changes_by_programme"]["0"],1)
        self.assertIn("250 °C",comparison_text(report))

    def test_wrong_controller_and_corrupt_backups_rejected(self):
        with self.assertRaisesRegex(ValueError,"same controller model"):
            self.compare(make_backup(),make_backup(model="E5EC-TQX3A"))
        broken=make_backup()
        broken["programmes"]["2"].pop()
        with self.assertRaises(ValueError):
            self.compare(make_backup(),broken)
        self.first.write_text("{}",encoding="utf-8")
        with self.assertRaises(ValueError):
            compare_saved_backups(self.first,self.second)

if __name__=="__main__":
    unittest.main()
