"""Native offline/website programme-entry parity tests; no internet or USB required."""
import os
os.environ.setdefault("QT_QPA_PLATFORM","offscreen")
import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from PySide6.QtWidgets import QApplication
from qt_app import Studio,EXAMPLE
from qt_entry_plan import make_entry_plan,plain_instructions
from qt_manual import make_manual
from program_model import Programme,Segment

class OfflineManualTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.app=QApplication.instance() or QApplication(["manual-parity"])
    def test_website_codes_and_values_for_four_segment_profile(self):
        plan=make_entry_plan(EXAMPLE,0)
        rows=[(p["code"],p["value"]) for p in plan["entry_rows"]]
        self.assertIn(("d.prg","0"),rows)
        self.assertIn(("s-no","4"),rows)
        self.assertEqual([r[1] for r in rows if r[0]=="styp"],["ramp","soak","ramp","soak"])
        self.assertEqual([r[1] for r in rows if r[0]=="sp"],["120 °C","50 °C"])
        self.assertEqual([r[1] for r in rows if r[0]=="pr"],["2 °C/min","2 °C/min"])
        self.assertEqual([r[1] for r in rows if r[0]=="time"],
                         ["0.15 (h.mm)","0.15 (h.mm)"])
        self.assertIn(("d.seg","end"),rows)
        self.assertIn(("rpt","0"),rows)
        self.assertIn(("link","end"),rows)
        self.assertIn(("prg","0"),rows)
        self.assertEqual(plan["nominal_minutes"],115)
    def test_key_actions_meanings_and_print_table_present(self):
        plan=make_entry_plan(EXAMPLE,0)
        all_actions=plain_instructions(plan)
        for key in ("LEVEL","MODE","UP/DOWN","PF","d.prg","pgsg","rst","d.seg"):
            self.assertIn(key,all_actions)
        self.assertIn("0.15 means 15 minutes",all_actions)
        html=make_manual(EXAMPLE,0)
        for label in ("Omron display","Required value","What it controls",
                      "How to enter or verify it","Programme-wide","LEVEL"):
            self.assertIn(label,html)
        self.assertIn("0.15 (h.mm)",html)
        self.assertNotIn("download the website",html)
    def test_instant_step_has_target_but_not_rate(self):
        p=Programme("step", "20","rst",[Segment("step",sp="70")])
        plan=make_entry_plan(p,3)
        row=[x for x in plan["entry_rows"] if x["section"]=="Segment 0 — STEP"]
        self.assertEqual([(x["code"],x["value"]) for x in row],
                         [("d.seg","0"),("styp","step"),("sp","70 °C")])
    def test_configuration_proposal_not_an_invented_keypad_action(self):
        plan=make_entry_plan(EXAMPLE,0,changes={"C5:0000":255})
        self.assertEqual(len(plan["setup_proposals"]),1)
        self.assertIn("NOT VERIFIED",plan["setup_proposals"][0]["entry"])
        html=make_manual(EXAMPLE,0,draft={"C5:0000":255})
        self.assertIn("Additional configuration change proposals",html)
    def test_qt_offline_shows_full_entry_table(self):
        window=Studio(enable_lab_writes=False)
        window.connection_timer.stop()
        window.choose_mode("offline")
        window.programmes[0]=EXAMPLE
        window._render_programme()
        window.show_step(4)
        self.assertEqual(window.apply_tabs.currentIndex(),0)
        self.assertEqual(window.entry_table.columnCount(),4)
        self.assertGreater(window.entry_table.rowCount(),20)
        headers=[window.entry_table.horizontalHeaderItem(i).text() for i in range(4)]
        self.assertEqual(headers,["Controller display","Value to set / verify",
                                  "Meaning","How to enter it"])
        shown=[window.entry_table.item(i,0).text()
               for i in range(window.entry_table.rowCount())]
        self.assertIn("time",shown)
        self.assertIn("prg",shown)
        window.close()

if __name__=="__main__":unittest.main()
