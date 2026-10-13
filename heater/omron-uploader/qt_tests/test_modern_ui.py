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
    def test_five_steps_and_offline_mode(self):
        self.assertEqual(self.win.pages.count(),5)
        self.assertEqual(len(self.win.navbuttons),5)
        self.win.choose_mode("offline")
        self.assertEqual(self.win._current_step,2)
        self.assertIsNone(self.win.client)
        self.assertEqual(self.win.inventory["mode"],"offline")
        self.win.next()
        self.assertEqual(self.win._current_step,3)
        self.win.next()
        self.assertEqual(self.win._current_step,4)
        self.assertFalse(self.win.preview_button.isEnabled())
        self.assertFalse(self.win.stage_button.isEnabled())
        self.assertFalse(self.win.save_button.isEnabled())
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
