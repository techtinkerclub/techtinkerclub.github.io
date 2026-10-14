"""Settings discovery is for everyone; no role-based permissions."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from settings_presentation import VIEWS,EVERYDAY,view_for,visible_in_view,scope_for
from controller_inventory import CATALOG

class SettingsPresentationTests(unittest.TestCase):
    def test_everyday_focused_not_a_permission_boundary(self):
        self.assertEqual(view_for("C1:0021"),VIEWS[0])
        self.assertEqual(view_for("C3:0000"),VIEWS[2])
        self.assertEqual(view_for("C5:0000"),VIEWS[1])
        self.assertEqual(view_for("C0:0000"),VIEWS[2])
        self.assertTrue(visible_in_view("C1:0021","",VIEWS[0]))
        self.assertFalse(visible_in_view("C3:0000","",VIEWS[0]))
        self.assertTrue(visible_in_view("C3:0000","",VIEWS[3]))

    def test_search_covers_all_settings_regardless_of_selected_view(self):
        for code in ("C3:0000","C1:0021","C5:0000","C0:0000"):
            for view in VIEWS:
                self.assertTrue(visible_in_view(code,"",view,query="sensor"))
        self.assertEqual(set(EVERYDAY)-set(CATALOG),set())

    def test_global_and_contextual_scope_explained(self):
        self.assertIn("all eight",scope_for("C1:0021"))
        self.assertIn("GLOBAL",scope_for("C3:00BE"))
        self.assertIn("all",scope_for("C3:0000"))
        self.assertIn("PID SET",scope_for("C5:0000"))
        self.assertIn("READ-ONLY",scope_for("C0:0000"))

    def test_unknown_view_refused(self):
        with self.assertRaises(ValueError):
            visible_in_view("C1:0021","","Technician only")
if __name__=="__main__":
    unittest.main()
