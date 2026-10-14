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
    def test_connected_type5_manual_cannot_show_fractional_targets(self):
        p=Programme("test","20","rst",[Segment("ramp",sp="80.5",rate="2")])
        plan5=make_entry_plan(p,0,baseline={"C3:0000":5})
        self.assertTrue(any("increment" in warning or "resolution" in warning
                            for warning in plan5["warnings"]))
        self.assertTrue(any(r["code"]=="INPUT / SETPOINT REVIEW"
                            for r in plan5["entry_rows"]))
        plan=make_entry_plan(p,0,baseline={"C3:0000":6})
        self.assertTrue(any("0.1 °C" in r["value"] for r in plan["entry_rows"]
                            if r["code"]=="in-t"))
    def test_offline_unknown_input_resolution_is_explicit(self):
        plan=make_entry_plan(EXAMPLE,0)
        self.assertTrue(any("UNKNOWN" in r["value"] for r in plan["entry_rows"]
                            if r["code"]=="in-t"))
    def test_verified_initial_setting_menu_gets_specific_key_instructions(self):
        plan=make_entry_plan(EXAMPLE,0,changes={"C3:00BD":1})
        proposal=plan["setup_proposals"][0]
        self.assertEqual(proposal["code"],"C3:00BD")
        self.assertIn("p-on",proposal["entry"])
        self.assertIn("hold LEVEL",proposal["entry"])
        self.assertIn("press MODE",proposal["entry"])
    def test_incompatible_rate_or_time_unit_must_not_produce_wrong_sheet(self):
        for parameter,wrong in (("C3:00B9",1),("C3:00BA",0),("C3:00BB",1)):
            with self.subTest(parameter=parameter):
                with self.assertRaises(ValueError):
                    make_entry_plan(EXAMPLE,0,changes={parameter:wrong})
    def test_end_continue_is_explicit_and_not_auto_uploaded(self):
        p=Programme("End mode", "20","cont",
              [Segment("ramp",sp="80",rate="2")])
        plan=make_entry_plan(p,0)
        self.assertIn("cont", [r["value"] for r in plan["entry_rows"]
                               if r["code"]=="eset"][0])
        self.assertTrue(any("CAUTION" in r["value"] for r in plan["entry_rows"]))
    def test_initial_setting_draft_visible_in_native_manual_table(self):
        w=Studio(enable_lab_writes=False)
        w.connection_timer.stop()
        w.choose_mode("offline")
        w.programmes[0]=EXAMPLE
        w._render_programme()
        w.draft={"C3:00BD":1}
        w.show_step(4)
        visible=[w.entry_table.item(i,0).text()
                 for i in range(w.entry_table.rowCount())]
        self.assertIn("C3:00BD",visible)
        i=visible.index("C3:00BD")
        w.entry_table.selectRow(i)
        self.assertIn("p-on",w.manual_instructions.toPlainText())
        self.assertIn("RESET",w.manual_purpose.text().upper()
                      if "RESET" in w.manual_purpose.text().upper() else
                      w.manual_value.text().upper())
        w.close()
    def test_bundled_keypad_simulator_is_local_and_optional(self):
        from unittest.mock import patch
        w=Studio(enable_lab_writes=False)
        w.connection_timer.stop()
        with patch("qt_app.webbrowser.open") as open_page:
            w.open_keypad_practice()
        open_page.assert_called_once()
        uri=open_page.call_args.args[0]
        self.assertTrue(uri.startswith("file:"))
        self.assertTrue(uri.endswith("/program-tools/index.html"))
        w.close()
    def test_step_manual_requires_global_wait_check_in_worksheet(self):
        program=Programme("Step arrival","20","rst",[
            Segment("step",sp="180"),Segment("soak",minutes="15")])
        plan=make_entry_plan(program,0,baseline={"C1:0021":0})
        wait=[r for r in plan["entry_rows"] if r["code"]=="wt-b"]
        self.assertEqual(len(wait),1)
        self.assertIn("OFF",wait[0]["value"])
        self.assertIn("GLOBAL",wait[0]["purpose"])
        self.assertIn("LEVEL",wait[0]["instruction"])
        self.assertTrue(any(r["code"]=="WAIT VERIFICATION" for r in plan["entry_rows"]))
        planned=make_entry_plan(program,0,baseline={"C1:0021":0},
                                changes={"C1:0021":30})
        self.assertIn("PROPOSED ONLY",next(r for r in planned["entry_rows"]
                           if r["code"]=="wt-b")["value"])
        self.assertIn("wt-b",make_manual(program,0))
        live=make_entry_plan(program,0,baseline={"C1:0021":30})
        self.assertIn("±3 °C",next(r for r in live["entry_rows"]
                      if r["code"]=="wt-b")["value"])
        self.assertFalse(any(r["code"]=="WAIT VERIFICATION" for r in live["entry_rows"]))

    def test_qt_offline_shows_full_entry_table(self):
        window=Studio(enable_lab_writes=False)
        window.connection_timer.stop()
        window.choose_mode("offline")
        window.programmes[0]=EXAMPLE
        window._render_programme()
        window.show_step(4)
        self.assertEqual(window.apply_tabs.currentIndex(),0)
        self.assertEqual(window.entry_table.columnCount(),2)
        self.assertGreater(window.entry_table.rowCount(),20)
        headers=[window.entry_table.horizontalHeaderItem(i).text() for i in range(2)]
        self.assertEqual(headers,["Omron display","Value to set / check"])
        self.assertIn("rst",window.manual_value.text())
        self.assertIn("MODE",window.manual_instructions.toPlainText())
        window.manual_phase.setCurrentText("Segment 1 — SOAK")
        self.assertEqual(window.entry_table.rowCount(),3)
        window._manual_move(1)
        self.assertIn("2 of 3",window.manual_position.text())
        window.manual_phase.setCurrentText("All stages")
        shown=[window.entry_table.item(i,0).text()
               for i in range(window.entry_table.rowCount())]
        self.assertIn("time",shown)
        self.assertIn("prg",shown)
        window.close()

if __name__=="__main__":unittest.main()
