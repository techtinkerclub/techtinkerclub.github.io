"""Five-step wizard smoke tests. Run on the Windows GitHub Actions builder.

Uses a real Tk window (withdrawn) so tab-parenting, callbacks and the offline
manual route are tested in the exact environment used to package the .exe.
No hardware communications occur.
"""
import sys, unittest, tempfile, json
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from controller_setup import offline_snapshot, apply_draft, build_proposal, validate_snapshot
from program_model import Programme, Segment

class OfflineConfigurationTests(unittest.TestCase):
    def test_offline_values_are_unknown_not_fabricated(self):
        s=offline_snapshot()
        self.assertEqual(s["mode"],"offline")
        self.assertIsNone(s["fields"]["C3:0000"])
        self.assertEqual(s["read_utc"],"OFFLINE — NO CONTROLLER READ")
        validate_snapshot(s)
    def test_offline_setup_included_in_export(self):
        s=offline_snapshot()
        changes=apply_draft(s,{},"C3:00BF",0)
        changes=apply_draft(s,changes,"C3:00BD",1)
        plan=build_proposal(s,changes)
        self.assertEqual(len(plan["proposed_changes"]),2)
        self.assertFalse(plan["controller_writes_performed"])
        self.assertIsNone(plan["proposed_changes"][0]["previous_raw"])

class FiveStepWizardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import tkinter as tk
        from app import Window
        cls.tk=tk
        cls.Window=Window
    def setUp(self):
        try:self.root=self.tk.Tk()
        except self.tk.TclError as exc:
            self.skipTest("No GUI display in runner: "+str(exc))
        self.root.withdraw()
        self.ui=self.Window(self.root,lab_mode=False)
        self.root.update_idletasks()
    def tearDown(self):
        if getattr(self,"root",None):
            try:self.root.destroy()
            except self.tk.TclError:pass
    def test_five_steps_and_offline_skips_connection(self):
        self.assertEqual(len(self.ui.book.tabs()),5)
        self.assertEqual(self.ui.book.index("current"),0)
        self.ui.choose_mode("offline")
        self.assertEqual(self.ui.book.index("current"),2)
        self.assertEqual(self.ui.connection_mode.get(),"offline")
        self.ui.wizard_next()
        self.assertEqual(self.ui.book.index("current"),3)
        self.ui.wizard_next()
        self.assertEqual(self.ui.book.index("current"),4)
        self.assertEqual(self.ui.review_note.get().split("\n")[1][:6],"OFFLIN")
        self.assertFalse(self.ui.safe_to_stage())
    def test_connected_flow_groups_three_views_in_step_two(self):
        self.ui.choose_mode("connected")
        self.assertEqual(self.ui.book.index("current"),1)
        self.assertEqual(len(self.ui.readbook.tabs()),3)
        self.assertFalse(self.ui.connected)
        self.ui.wizard_next()
        self.assertEqual(self.ui.book.index("current"),2)
        self.assertFalse(self.ui.safe_to_stage())
    def test_manual_includes_programme_and_initial_setting_without_website(self):
        self.ui.choose_mode("offline")
        self.ui.progs[0]=Programme(name="120 C ramp / 50 C cool",start="20",finish="rst",
            steps=[Segment("ramp",sp="120",rate="2"),Segment("soak",minutes="15"),
                   Segment("ramp",sp="50",rate="2"),Segment("soak",minutes="15")])
        self.ui.slot.set(0)
        self.ui._refresh_programme()
        self.ui.setup_draft=apply_draft(self.ui.setup_snapshot,{},"C3:00BF",0)
        self.ui.setup_draft=apply_draft(self.ui.setup_snapshot,self.ui.setup_draft,"C3:00BD",1)
        with tempfile.TemporaryDirectory() as temp:
            output=str(Path(temp)/"manual.html")
            with patch("tkinter.filedialog.asksaveasfilename",return_value=output),\
                 patch("tkinter.messagebox.askyesno",return_value=False):
                self.ui.entry_sheet()
            html=Path(output).read_text(encoding="utf-8")
            self.assertIn("Programme 0",html)
            self.assertIn("115.0 min",html)
            self.assertIn("4 segments",html)
            self.assertIn("ramp",html.lower())
            self.assertIn("Power-up action",html)
            self.assertIn("Requested initial setting changes",html)
            self.assertIn("pvst",html)
            self.assertIn("p-on",html)
            self.assertNotIn("import JSON",html)

if __name__=="__main__":
    unittest.main()
