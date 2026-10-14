"""Smoke tests for the new native Windows PySide6 Studio.

All tests operate OFFLINE or use a mocked controller. They must NEVER
communicate with a physical Omron or issue any write command.
"""
import os
os.environ.setdefault("QT_QPA_PLATFORM","offscreen")
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from PySide6.QtWidgets import QApplication
from qt_app import Studio, EXAMPLE
from qt_manual import make_manual
from program_model import Segment,Programme
from controller_inventory import CATALOG


class ModernStudioTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app=QApplication.instance() or QApplication(["test-modern-ui"])
    def setUp(self):
        self.win=Studio(enable_lab_writes=False)
        self.win.connection_timer.stop()
        self.win.message=lambda *args,**kw:None
    def tearDown(self):
        self.win.close()
    def test_read_only_backup_comparison_from_offline_workspace(self):
        import json
        with tempfile.TemporaryDirectory() as folder:
            a={"schema":"e5cct-backup-1",
               "controller":{"model10":"E5CC-TQX3A"},
               "preflight":{"C3:0000":5},
               "programmes":{str(i):["00000000"]*150 for i in range(8)}}
            for block in a["programmes"].values():
                block[0]="00000001"
                block[0x16]="00000000"
                block[0x17]="00000078"
            before=Path(folder)/"before.json"
            after=Path(folder)/"after.json"
            before.write_text(json.dumps(a),encoding="utf-8")
            a["preflight"]["C3:0000"]=6
            after.write_text(json.dumps(a),encoding="utf-8")
            self.win.choose_mode("offline")
            with patch("qt_app.QFileDialog.getOpenFileName",
                       side_effect=[(str(before),"JSON (*.json)"),
                                    (str(after),"JSON (*.json)")]):
                self.win.compare_saved_backups()
            self.assertIsNone(self.win.client)
            self.assertEqual(self.win._current_step,1)
            self.assertEqual(self.win.read_host.currentIndex(),0)
            self.assertEqual(self.win.read_tabs.currentIndex(),3)
            self.assertTrue(self.win.export_comparison_button.isEnabled())
            self.assertEqual(self.win.backup_comparison["changed_raw_words"],0)
            self.assertEqual(len(self.win.backup_comparison["interpreted_target_changes"]),8)
            text=self.win.comparison_text.toPlainText()
            self.assertIn("120 °C -> 12 °C",text)
            self.assertIn("No USB operations",text)

    def test_five_steps_and_offline_mode(self):
        self.assertEqual(self.win.pages.count(),5)
        self.assertEqual(len(self.win.navbuttons),5)
        self.win.choose_mode("offline")
        self.assertEqual(self.win._current_step,1)
        self.assertEqual(self.win.read_host.currentIndex(),1)
        self.assertIsNone(self.win.client)
        self.assertEqual(self.win.inventory["mode"],"offline")
        self.win.next()
        self.assertEqual(self.win._current_step,2)
        self.win.next()
        self.assertEqual(self.win._current_step,3)
        self.win.next()
        self.assertEqual(self.win._current_step,4)
        self.assertFalse(self.win.preview_button.isEnabled())
        self.assertFalse(self.win.stage_button.isEnabled())
        self.assertFalse(self.win.save_button.isEnabled())
    def test_settings_are_understandable_without_omron_register_knowledge(self):
        self.win.show_step(3)
        self.assertEqual(self.win.settings_view.currentText(),"Everyday essentials")
        self.assertIn("C1:0021",self.win.setting_keys)
        self.assertNotIn("C3:0000",self.win.setting_keys)
        self.assertFalse(self.win.show_setting_technical.isChecked())
        self.win.setting_table.selectRow(self.win.setting_keys.index("C1:0021"))
        self.win._setting_selected()
        self.assertIn("all eight programmes",self.win.parameter_detail.toPlainText())
        self.assertNotIn("Omron register:",self.win.parameter_detail.toPlainText())
        self.win.search.setText("C3:0000")
        self.assertIn("C3:0000",self.win.setting_keys)
        self.win.setting_table.selectRow(self.win.setting_keys.index("C3:0000"))
        self.win._setting_selected()
        self.assertIn("SYSTEM-WIDE",self.win.parameter_detail.toPlainText())
        self.win.show_setting_technical.setChecked(True)
        self.assertIn("Omron register: C3:0000",self.win.parameter_detail.toPlainText())
        self.win.search.clear()
        self.win.settings_view.setCurrentText("All parameters")
        self.assertEqual(len(self.win.setting_keys),len(CATALOG))

    def test_programme_end_is_explained_as_global_not_per_memory(self):
        self.win.show_step(2)
        self.assertIn("GLOBAL",self.win.finish_mode.toolTip())
        self.assertIn("every programme",self.win.finish_mode.toolTip())
        self.assertEqual(self.win.finish_mode.count(),2)

    def test_programme_segments_and_nominal_duration(self):
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.assertEqual(self.win.segment_table.rowCount(),4)
        p=self.win.programmes[0]
        self.assertAlmostEqual(p.validate()["minutes"],115)
        self.assertIn("115.0",self.win.programme_info.text())
        self.win.segment_table.selectRow(1)
        self.win.duplicate_segment()
        self.assertEqual(self.win.segment_table.rowCount(),5)
        self.win.segment_table.selectRow(2)
        self.win.remove_segment()
        self.assertEqual(self.win.segment_table.rowCount(),4)
    def test_segments_only_expose_their_valid_parameters(self):
        import copy
        self.win.programmes[0]=copy.deepcopy(EXAMPLE)
        self.win._render_programme()
        ramp=self.win.segment_table.cellWidget(0,0)
        soak=self.win.segment_table.cellWidget(1,0)
        self.assertFalse(ramp.target.isHidden())
        self.assertFalse(ramp.rate.isHidden())
        self.assertTrue(ramp.hold.isHidden())
        self.assertTrue(soak.target.isHidden())
        self.assertTrue(soak.rate.isHidden())
        self.assertFalse(soak.hold.isHidden())
        old=ramp.target.spin.value()
        ramp.target.up.click()
        self.assertAlmostEqual(ramp.target.spin.value(),old+0.1,places=3)
        self.assertAlmostEqual(float(self.win.programmes[0].steps[0].sp),old+0.1,places=3)
        soak.kind.setCurrentText("step")
        self.assertFalse(soak.target.isHidden())
        self.assertTrue(soak.rate.isHidden())
        self.assertTrue(soak.hold.isHidden())
        self.assertEqual(self.win.programmes[0].steps[1].type,"step")

    def test_numeric_fields_have_visible_readable_text_and_programme_updates(self):
        from PySide6.QtTest import QTest
        from PySide6.QtCore import Qt
        import copy
        self.win.programmes[0]=copy.deepcopy(EXAMPLE)
        self.win._render_programme()
        row=self.win.segment_table.cellWidget(0,0)
        # The painted widget must be an ordinary high-contrast QLineEdit,
        # not the clipped internal editor of a nested QSpinBox.
        self.assertTrue(row.target.editor.isVisibleTo(row))
        self.assertFalse(row.target.spin.isVisible())
        self.assertEqual(row.target.editor.text(),"120.000")
        self.assertIn("QLineEdit#numericEntry",self.win.styleSheet())
        self.assertIn("color:#18334a",self.win.styleSheet())
        self.assertEqual(row.rate.editor.text(),"2")
        self.assertEqual(self.win.segment_table.cellWidget(1,0).hold.editor.text(),"15")
        row.target.editor.setFocus()
        row.target.editor.selectAll()
        QTest.keyClicks(row.target.editor,"125.0")
        self.assertAlmostEqual(float(self.win.programmes[0].steps[0].sp),125.0)
        self.assertEqual(row.target.editor.text(),"125.0")
        row.target.down.click()
        self.assertEqual(row.target.editor.text(),"124.9")
        self.assertAlmostEqual(float(self.win.programmes[0].steps[0].sp),124.9)
        self.assertEqual(self.win.start_pv_editor.editor.text(),"20.0")
        self.win.start_pv_editor.up.click()
        self.assertEqual(self.win.start_pv_editor.editor.text(),"20.1")
        self.assertAlmostEqual(float(self.win.programmes[0].start),20.1)
        # All four row actions use actual QIcons, not missing font glyphs.
        for control in row.findChildren(__import__(
                "PySide6.QtWidgets",fromlist=["QToolButton"]).QToolButton):
            if control.objectName()=="rowAction":
                self.assertFalse(control.icon().isNull())
                self.assertTrue(control.accessibleName())

    def test_invalid_number_never_changes_heater_profile(self):
        import copy
        self.win.programmes[0]=copy.deepcopy(EXAMPLE)
        self.win._render_programme()
        row=self.win.segment_table.cellWidget(0,0)
        before=float(self.win.programmes[0].steps[0].sp)
        row.target._typed_value("not a number")
        self.assertAlmostEqual(float(self.win.programmes[0].steps[0].sp),before)
        row.target._typed_value("501")
        self.assertAlmostEqual(float(self.win.programmes[0].steps[0].sp),501)
        self.assertIn("501",self.win.programme_info.text())
        self.assertIn("WARNING",self.win.temperature_limits_hint.text())

    def test_all_sensor_choices_allow_offline_drafting_without_clamping(self):
        import copy
        self.win.programmes[0]=copy.deepcopy(EXAMPLE)
        self.win._render_programme()
        self.assertEqual(self.win.editor_sensor.count(),31)
        row=self.win.segment_table.cellWidget(0,0)
        row.target._typed_value("1800")
        self.assertEqual(float(self.win.programmes[0].steps[0].sp),1800)
        self.assertIn("WARNING",self.win.temperature_limits_hint.text())
        idx=self.win.editor_sensor.findData(19)
        self.win.editor_sensor.setCurrentIndex(idx)
        self.assertIn("W",self.win.temperature_limits_hint.text())
        self.assertEqual(float(self.win.programmes[0].steps[0].sp),1800)

    def test_uniform_controls_across_programme_and_other_steps(self):
        from PySide6.QtWidgets import QComboBox,QToolButton
        from PySide6.QtGui import QPixmap
        from PySide6.QtCore import Qt
        from qt_components import StudioCombo
        self.win.show()
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        all_combos=[self.win.port_combo,self.win.slot_combo,
                    self.win.finish_mode,self.win.group,
                    self.win.parameter_choices,self.win.manual_phase,
                    self.win.segment_table.cellWidget(0,0).kind]
        self.assertTrue(all(isinstance(combo,StudioCombo) for combo in all_combos))
        qss=self.win.styleSheet()
        for token in ("QComboBox::drop-down","QTabBar::tab","QFrame#valueField",
                      "QLineEdit#numericEntry","QToolButton#rowAction",
                      "QToolButton#spinArrow"):
            self.assertIn(token,qss)
        for combo in all_combos:
            self.assertGreaterEqual(combo.minimumHeight(),38)
        row=self.win.segment_table.cellWidget(0,0)
        self.assertEqual(row.target.findChild(
            __import__("PySide6.QtWidgets",fromlist=["QFrame"]).QFrame,
            "valueField").height(),38)
        self.assertTrue(row.target.up.icon().isNull() is False)
        self.assertTrue(row.target.down.icon().isNull() is False)
        dropdown=self.win.slot_combo
        dropdown.resize(220,40)
        snapshot=QPixmap(dropdown.size())
        snapshot.fill(Qt.GlobalColor.transparent)
        dropdown.render(snapshot)
        self.assertFalse(snapshot.isNull())
        self.assertEqual(dropdown.itemText(0),"Programme 0")
        dropdown.setCurrentIndex(1)
        self.assertEqual(dropdown.currentIndex(),1)
        self.win.hide()

    def test_dropdowns_fit_short_values_and_explain_long_ones(self):
        from qt_components import StudioCombo
        from PySide6.QtGui import QFont
        from PySide6.QtWidgets import QComboBox
        self.win.show()
        self.win.show_step(2)
        values=[(self.win.slot_combo,"Programme 0"),
                (self.win.finish_mode,"RESET (stop)")]
        for combo,value in values:
            self.assertIsInstance(combo,StudioCombo)
            self.assertEqual(combo.currentText(),value)
            # Includes text, 34px arrow and Qt stylesheet's padding.
            required=combo.fontMetrics().horizontalAdvance(value)+68
            self.assertGreaterEqual(combo.minimumWidth(),required)
            self.assertGreaterEqual(combo.width(),required)
            self.assertEqual(combo.toolTip(),value)
        self.win.slot_combo.setCurrentIndex(7)
        self.assertEqual(self.win.slot_combo.toolTip(),"Programme 7")
        self.win.finish_mode.setCurrentIndex(1)
        self.assertEqual(self.win.finish_mode.toolTip(),"CONTINUE")
        long=StudioCombo()
        long.addItems(["Short","A very long conditional initial-setting explanation for the controller"])
        long.show()
        self.assertLessEqual(long.minimumWidth(),310)
        long.setCurrentIndex(1)
        self.assertEqual(long.toolTip(),long.currentText())
        self.assertGreater(long.view().minimumWidth(),long.minimumWidth())
        long.close()
        self.win.hide()

    def test_step_wait_band_requires_hardware_verification_and_links_to_setting(self):
        import copy
        from program_model import Segment,Programme
        self.win.choose_mode("offline")
        self.win.programmes[0]=Programme("Step test","20","rst",[
            Segment("step",sp="180"),Segment("soak",minutes="15")])
        self.win._render_programme()
        self.assertIn("NOT VERIFIED",self.win.wait_hint.text())
        self.assertIn("GLOBAL",self.win.wait_hint.text() or "global")
        self.assertFalse(self.win.stage_button.isEnabled())
        self.win.goto_wait_setting()
        self.assertEqual(self.win._current_step,3)
        self.assertEqual(self.win.search.text(),"C1:0021")
        self.assertIn("C1:0021",self.win.setting_keys)
        self.win.inventory["fields"]["C1:0021"]=0
        self.win._refresh_wait_hint()
        self.assertIn("NOT VERIFIED",self.win.wait_hint.text())
        self.win.search.setText("")
        self.win.programmes[0]=copy.deepcopy(EXAMPLE)
        self.win._render_programme()
        self.assertFalse(self.win.wait_configure.isVisibleTo(self.win.pages.widget(2)))

    def test_settings_search_updates_detail_even_when_selected_row_stays_zero(self):
        # Regression for first filtered item reusing row zero after a previous
        # setting was selected. Qt does not necessarily emit selectionChanged.
        self.win.choose_mode("offline")
        self.win.inventory["fields"]["C1:0021"]=20
        self.win.inventory["fields"]["C1:0026"]=500
        self.win.settings_view.setCurrentText("All parameters")
        self.win.refresh_settings()
        self.win.setting_table.selectRow(0)  # Start from a different row-zero register.
        self.win._setting_selected()
        first=self.win._selected_setting_code()
        self.assertNotEqual(first,"C1:0021")
        self.win.search.setText("C1:0021")
        self.assertEqual(self.win.setting_table.rowCount(),1)
        self.assertEqual(self.win._selected_setting_code(),"C1:0021")
        self.assertIn("Wait band",self.win.parameter_detail.toPlainText())
        self.assertFalse(self.win.parameter_editor.isHidden())
        self.assertEqual(self.win.parameter_editor.text(),"2")
        self.win.parameter_editor.setText("1.0")
        self.win.propose_setting()
        self.assertEqual(self.win.draft["C1:0021"],10)
        # Search for a neighbouring register, then return to Wait Band:
        # the right-hand editor must switch BOTH times.
        self.win.search.setText("C1:0026")
        self.assertIn("MV upper limit",self.win.parameter_detail.toPlainText())
        self.assertEqual(self.win._selected_setting_code(),"C1:0026")
        self.win.search.setText("C1:0021")
        self.assertIn("Wait band",self.win.parameter_detail.toPlainText())
        self.assertEqual(self.win.parameter_editor.text(),"1")
        self.assertEqual(self.win._selected_setting_code(),"C1:0021")

    def test_revert_edit_and_just_one_proposal_without_retyping_original(self):
        self.win.choose_mode("offline")
        self.win.inventory["fields"]["C1:0021"]=20
        self.win.inventory["fields"]["C1:0015"]=120
        self.win.search.setText("C1:0021")
        self.assertEqual(self.win.parameter_editor.text(),"2")
        self.assertFalse(self.win.revert_setting_button.isEnabled())
        # A typed but not-yet-proposed value should be reversible as well.
        self.win.parameter_editor.setText("3.5")
        self.assertTrue(self.win.revert_setting_button.isEnabled())
        self.win.revert_setting()
        self.assertEqual(self.win.parameter_editor.text(),"2")
        self.assertFalse(self.win.revert_setting_button.isEnabled())
        # Changing one setting must not erase an unrelated pending proposal.
        self.win.parameter_editor.setText("1.5")
        self.win.propose_setting()
        self.assertEqual(self.win.draft["C1:0021"],15)
        self.win.search.setText("C1:0015")
        self.win.parameter_editor.setText("13.5")
        self.win.propose_setting()
        self.assertEqual(self.win.draft["C1:0015"],135)
        self.win.search.setText("C1:0021")
        self.assertTrue(self.win.revert_setting_button.isEnabled())
        self.win.revert_setting()
        self.assertNotIn("C1:0021",self.win.draft)
        self.assertEqual(self.win.draft["C1:0015"],135)
        self.assertEqual(self.win.parameter_editor.text(),"2")
        self.assertFalse(self.win.revert_setting_button.isEnabled())

    def test_control_algorithm_dependency_navigable_and_dropdown_revert(self):
        self.win.choose_mode("offline")
        self.win.inventory["fields"]["C1:0015"]=120
        self.win.inventory["fields"]["C3:0007"]=0
        self.win.search.setText("C1:0015")
        self.assertIn("REQUIRES: Control algorithm = PID",self.win.setting_dependency_note.text())
        self.assertIn("ON/OFF",self.win.setting_dependency_note.text())
        self.assertTrue(self.win.open_dependency_button.isVisibleTo(self.win.pages.widget(3)))
        self.win.open_required_setting()
        self.assertEqual(self.win._selected_setting_code(),"C3:0007")
        self.assertIn("Control algorithm",self.win.parameter_detail.toPlainText())
        self.assertFalse(self.win.revert_setting_button.isEnabled())
        self.win.parameter_choices.setCurrentIndex(self.win.parameter_choices.findData(1))
        self.assertTrue(self.win.revert_setting_button.isEnabled())
        self.win.propose_setting()
        self.assertEqual(self.win.draft["C3:0007"],1)
        self.win.revert_setting()
        self.assertNotIn("C3:0007",self.win.draft)
        self.assertEqual(self.win.parameter_choices.currentData(),0)
        self.assertFalse(self.win.revert_setting_button.isEnabled())

    def test_offline_configuration_proposal_blocks_upload(self):
        self.win.choose_mode("offline")
        self.win.group.setCurrentText("All groups")
        self.win.search.setText("C3:0000")
        self.assertEqual(self.win.setting_table.rowCount(),1)
        self.win.setting_table.selectRow(0)
        self.win.parameter_choices.setCurrentIndex(
            self.win.parameter_choices.findData(5))
        self.win.propose_setting()
        self.assertEqual(self.win.draft["C3:0000"],5)
        self.win.show_step(4)
        self.assertIn("CONFIGURATION CHANGE LIST",self.win.apply_details.toPlainText())
        self.assertFalse(self.win.stage_button.isEnabled())
        self.assertEqual(len(self.win.draft),1)
    def test_offline_printable_manual_uses_same_programme(self):
        html=make_manual(EXAMPLE,0)
        for x in ("d.prg","s-no","d.seg","styp","pr","time","115.0"):
            self.assertIn(x,html)
        self.assertIn("120",html)
        self.assertIn("50",html)
        self.assertIn("nominal",html)
        self.assertNotIn("download a website",html)
    def test_native_offline_project_round_trip_with_atomic_save(self):
        import copy
        from tempfile import TemporaryDirectory
        from unittest.mock import patch
        from program_model import blank_programme
        with TemporaryDirectory() as folder:
            p=str(Path(folder)/"qt-project.json")
            self.win.choose_mode("offline")
            self.win.programmes[0]=copy.deepcopy(EXAMPLE)
            self.win._render_programme()
            with patch("qt_app.QFileDialog.getSaveFileName",return_value=(p,"")):
                self.win.save_project()
            self.assertTrue(Path(p).exists())
            self.win.programmes[0]=blank_programme()
            self.win._render_programme()
            with patch("qt_app.QFileDialog.getOpenFileName",return_value=(p,"")):
                self.win.open_project()
            self.assertEqual(len(self.win.programmes[0].steps),4)
            self.assertAlmostEqual(self.win.programmes[0].validate()["minutes"],115)
            self.assertIsNone(self.win.session)
    def test_manual_continue_end_mode_is_local_and_not_uploadable(self):
        self.win.choose_mode("offline")
        self.win.finish_mode.setCurrentIndex(1)
        self.win.show_step(4)
        self.assertEqual(self.win.programmes[0].finish,"cont")
        self.assertEqual(self.win.apply_tabs.currentIndex(),0)
        end_rows=[i for i in range(self.win.entry_table.rowCount())
                  if self.win.entry_table.item(i,0).text()=="eset"]
        self.assertTrue(end_rows)
        self.assertTrue(any("cont" in self.win.entry_table.item(i,1).text().lower()
                            for i in end_rows))
        self.assertFalse(self.win.stage_button.isEnabled())
    def test_serial_writes_impossible_without_lab_flag(self):
        self.win.mode="connected"
        self.win.show_step(4)
        self.assertFalse(self.win.lab)
        self.assertFalse(self.win.stage_button.isEnabled())
        self.assertFalse(self.win.save_button.isEnabled())
    def test_unchanged_physical_configuration_does_not_invent_values(self):
        self.win.choose_mode("offline")
        self.assertIsNone(self.win.inventory["fields"]["C3:0000"])
        self.win.search.setText("C3:0000")
        self.assertIn("Unavailable",self.win.setting_table.item(0,1).text())
        self.assertGreater(len(CATALOG),250)

if __name__=="__main__":unittest.main()
