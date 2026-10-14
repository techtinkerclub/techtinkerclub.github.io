"""Qt-to-backend integration: simulated controller, NO physical serial device.

Fakes deliberately reject unsupported write banks. Tests an exact 9-register
programme-0 preview, staged RAM readback and save receipt with the actual
TransferSession logic, not a duplicate upload implementation.
"""
from __future__ import annotations
import os
os.environ.setdefault("QT_QPA_PLATFORM","offscreen")
import sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from PySide6.QtWidgets import QApplication,QMessageBox
from qt_app import Studio,EXAMPLE
from transfer import PREFLIGHT

class FakeOmron:
    created=[]
    def __init__(self,port,node=1,timeout=1.8,write_allowed=False):
        self.port=port
        self.write_allowed=write_allowed
        self.closed=False
        self.calls=[]
        self.c3={addr:expected for addr,(expected,_) in PREFLIGHT.items()}
        self.c1={0x0021:0}
        self.da=[[0]*150 for _ in range(8)]
        for block in self.da:
            block[0]=1
            block[0x0e]=0
            block[0x0f]=0xffffffff
            block[0x16]=0
            block[0x17]=50
            block[0x18]=0
        self.__class__.created.append(self)
    def identify(self):
        return {"model10":"E5CC-TQX3A","buffer_bytes":217}
    def status(self):
        return "0100"
    def read(self,bank,addr,count=1):
        self.calls.append(("read",bank,addr,count))
        if bank=="DA":
            slot,off=addr>>8,addr&255
            return self.da[slot][off:off+count]
        if bank=="C3":
            return [self.c3.get(addr+i,0) for i in range(count)]
        if bank=="C1":
            return [self.c1.get(addr+i,0) for i in range(count)]
        return [0 for _ in range(count)]
    def read1(self,bank,addr):return self.read(bank,addr,1)[0]
    def write1(self,addr,value):
        assert self.write_allowed,"A disabled lab session attempted a write!"
        self.calls.append(("write","DA",addr,value))
        self.da[addr>>8][addr&255]=value&0xffffffff
    def write_setting(self,bank,addr,value):
        assert self.write_allowed
        assert (bank,addr)==("C1",0x0021)
        assert 0<=value<=9999
        self.calls.append(("setting-write",bank,addr,value))
        self.c1[addr]=value
    def operation(self,code,data):
        assert self.write_allowed
        assert (code,data) in {("00","01"),("00","00"),("04","01"),("05","00")}
        self.calls.append(("operation",code,data))
        return ""
    def close(self):self.closed=True

class QtConnectedTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app=QApplication.instance() or QApplication(["Qt-Omron-mock"])
    def setUp(self):
        self.dir=tempfile.TemporaryDirectory()
        self.oldserial=patch("qt_app.SerialClient",FakeOmron)
        self.oldserial.start()
        self.win=Studio(enable_lab_writes=True)
        self.win.connection_timer.stop()
        self.win.message=lambda *a,**k:None
        self.win.folder.setText(self.dir.name)
        self.win.port_combo.addItem("COM7")
        self.win.port_combo.setCurrentText("COM7")
        self.win.mode="connected"
        self.win._work=self.immediate_job
    def tearDown(self):
        self.win.close()
        self.oldserial.stop()
        self.dir.cleanup()
    def immediate_job(self,title,work,success,is_write=False,quiet=False):
        result=work(lambda _:None)
        success(result)
        self.win.refresh_actions()
    def test_read_backup_configuration_inventory_then_write_test_programme(self):
        self.win.connect_read()
        self.assertEqual(self.win.session.info["model10"],"E5CC-TQX3A")
        self.assertEqual(self.win.session.settings["C3:0000"],5)
        self.assertEqual(len(self.win.backup["programmes"]),8)
        self.assertEqual(self.win.inventory["fields"]["C5:0000"],0)
        self.assertTrue(list(Path(self.dir.name).glob("*programme-backup*.json")))
        self.assertTrue(list(Path(self.dir.name).glob("*initial-settings*.json")))
        self.assertTrue(list(Path(self.dir.name).glob("*full-inventory*.json")))
        fake=FakeOmron.created[-1]
        self.assertFalse(any(c[0]=="write" for c in fake.calls))
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.show_step(4)
        self.win.preview()
        self.assertEqual(len(self.win.preview_changes),9)
        self.win.refresh_actions()
        self.assertTrue(self.win.stage_button.isEnabled())
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.stage()
        self.assertTrue(self.win.session.staged)
        self.assertFalse(self.win.session.committed)
        self.assertEqual(fake.da[0][0],4)
        self.assertFalse(self.win.slot_combo.isEnabled())
        self.assertTrue(self.win.save_button.isEnabled())
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.commit()
        self.assertTrue(self.win.session.committed)
        self.assertTrue(self.win.session.receipt_file.exists())
        self.assertTrue(any(c[0]=="write" for c in fake.calls))
        self.assertEqual(sum(c[0]=="write" for c in fake.calls),9)
        self.assertTrue(self.win.slot_combo.isEnabled())
        self.assertTrue(self.win.cmw_off_button.isEnabled())
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.disable_cmw()
        self.assertTrue(self.win.session.communications_write_disabled)
        self.assertFalse(self.win.cmw_off_button.isEnabled())
        self.assertIn(("operation","00","00"),fake.calls)
        self.assertEqual([c for c in fake.calls if c==("operation","00","00")],
                         [("operation","00","00")])
        self.assertEqual(sum(c[0]=="write" for c in fake.calls),9)
    def test_cmw_off_requires_successful_nonvolatile_save(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.show_step(4)
        self.assertFalse(self.win.cmw_off_button.isEnabled())
        with self.assertRaises(Exception):
            self.win.session.disable_communications_writing()
        self.assertNotIn(("operation","00","00"),fake.calls)
        self.win.session.committed=True
        with self.assertRaises(Exception):
            self.win.session.disable_communications_writing()
        self.assertNotIn(("operation","00","00"),fake.calls)

    def test_real_qt_buttons_preview_stage_save_cmw_for_one_wait_band(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.draft={"C1:0021":30}
        self.win.show_step(3)
        self.win.refresh_actions()
        self.assertTrue(self.win.wt_preview.isEnabled())
        self.assertFalse(self.win.wt_stage.isEnabled())
        self.win.preview_wait()
        self.assertIsNotNone(self.win.setting_transfer)
        self.assertEqual(self.win.setting_transfer.preview_data["old_raw"],0)
        self.assertTrue(self.win.wt_stage.isEnabled())
        self.assertNotIn(("setting-write","C1",0x0021,30),fake.calls)
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.stage_wait()
        self.assertTrue(self.win.setting_transfer.staged)
        self.assertEqual(fake.c1[0x0021],30)
        self.assertTrue(self.win.wt_save.isEnabled())
        self.assertFalse(self.win.stage_button.isEnabled())
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.save_wait()
        self.assertTrue(self.win.setting_transfer.saved)
        self.assertTrue(self.win.setting_transfer.receipt_file.exists())
        self.assertEqual(self.win.draft,{})
        self.assertTrue(self.win.wt_cmw_off.isEnabled())
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.finish_wait()
        self.assertTrue(self.win.setting_transfer.cmw_off)
        self.assertEqual(sum(x[0]=="setting-write" for x in fake.calls),1)
        self.assertEqual(sum(x==("operation","05","00") for x in fake.calls),1)
        with patch("qt_app.QFileDialog.getOpenFileName",
                   return_value=(str(self.win.setting_transfer.receipt_file),"")):
            self.win.verify_wait()
        self.assertFalse(self.win.stage_button.isEnabled())

    def test_step4_edits_and_step5_routes_settings_transfer(self):
        self.win.connect_read()
        self.win.draft={"C1:0021":20}
        self.win.show_step(3)
        self.assertEqual(self.win.navbuttons[3].text(),"4   Controller Settings")
        self.assertTrue(hasattr(self.win,"wt_preview"))
        self.win.show_step(4)
        self.assertEqual(self.win.apply_tabs.count(),2)
        self.assertEqual(self.win.apply_tabs.tabText(0),"Offline / manual entry")
        self.assertEqual(self.win.apply_tabs.tabText(1),"USB transfer")
        self.assertEqual(self.win.apply_tabs.currentIndex(),1)
        self.assertTrue(not self.win.preview_button.isHidden())
        self.assertTrue(not self.win.wt_preview.isHidden())
        self.assertIn("NOT written",self.win.transfer_summary.text())
        self.assertIn("Wait band",self.win.config_review.toPlainText())
        self.assertIn("USB pilot available",self.win.config_review.toPlainText())
        self.assertFalse(self.win.preview_button.isEnabled())
        self.assertTrue(self.win.wt_preview.isEnabled())
        self.assertNotIn("USB configuration writes are not enabled",
                         self.win.apply_details.toPlainText())
        self.win.preview_wait()
        self.assertEqual(self.win.apply_tabs.currentIndex(),1)
        self.assertIn("read-only preview",self.win.config_review.toPlainText().lower())

    def test_saved_wt_b_is_visible_in_unified_review_and_not_confused_with_da(self):
        self.win.connect_read()
        self.win.draft={"C1:0021":20}
        self.win.show_step(4)
        self.assertEqual(self.win.apply_tabs.count(),2)
        self.win.preview_wait()
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.stage_wait()
            self.win.save_wait()
        self.assertEqual(self.win.draft,{})
        self.assertIn("wt-b 0 → 2 °C: SAVE acknowledged",self.win.transfer_summary.text())
        self.assertIn("power-cycle verification still required",
                      self.win.transfer_summary.text().lower())
        self.assertIn("no programme write in this connection",
                      self.win.transfer_summary.text())
        self.assertFalse(self.win.preview_button.isEnabled())
        self.assertIn("SAVE acknowledged",self.win.transfer_summary.text())
        self.assertTrue(self.win.wt_cmw_off.isEnabled())
        # A later proposed value must remain explicitly NOT WRITTEN,
        # even though a previous change was saved during this connection.
        self.win.draft={"C1:0021":10}
        self.win._refresh_transfer_summary()
        self.assertIn("SAVE acknowledged",self.win.transfer_summary.text())
        self.assertIn("proposed",self.win.transfer_summary.text().lower())
        self.assertIn("NOT written",self.win.transfer_summary.text())

    def test_unified_wait_transfer_auto_finishes_cmw(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.draft={"C1:0021":20}
        self.win.show_step(4)
        self.assertTrue(self.win.unified_preview.isEnabled())
        self.assertFalse(self.win.unified_stage.isEnabled())
        self.win.unified_preview_action()
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            self.assertTrue(self.win.unified_save.isEnabled())
            self.win.unified_save_action()
        tx=self.win.setting_transfer
        self.assertTrue(tx.saved)
        self.assertTrue(tx.cmw_off)
        self.assertEqual(self.win.draft,{})
        self.assertEqual(
            [c for c in fake.calls if c[0]=="operation"],
            [("operation","00","01"),("operation","04","01"),
             ("operation","05","00"),("operation","00","00")])

    def test_unified_programme_transfer_auto_finishes_cmw(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.show_step(4)
        self.win.unified_preview_action()
        self.assertTrue(self.win.unified_stage.isEnabled())
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            self.win.unified_save_action()
        self.assertTrue(self.win.session.committed)
        self.assertTrue(self.win.session.communications_write_disabled)
        self.assertTrue(self.win.session.receipt_file.exists())
        self.assertEqual(sum(c==("operation","05","00") for c in fake.calls),1)
        self.assertEqual(sum(c==("operation","00","00") for c in fake.calls),1)

    def test_unified_controls_never_write_unqualified_configuration(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.draft={"C3:0000":6}
        self.win.show_step(4)
        self.assertFalse(self.win.unified_preview.isEnabled())
        self.assertFalse(self.win.unified_stage.isEnabled())
        self.assertFalse(self.win.unified_save.isEnabled())
        self.win.unified_preview_action()
        self.win.unified_stage_action()
        self.win.unified_save_action()
        self.assertFalse(any(c[0] in ("write","setting-write") for c in fake.calls))

    def test_combined_wait_and_programme_one_save_and_cmw_off(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.draft={"C1:0021":20}
        self.win.show_step(4)
        self.assertTrue(self.win.include_programme_button.isEnabled())
        self.assertIn("OFF",self.win.include_programme_button.text())
        self.win.toggle_programme_inclusion()
        self.assertIn("ON",self.win.include_programme_button.text())
        self.assertTrue(self.win.unified_preview.isEnabled())
        self.win.unified_preview_action()
        tx=self.win.combined_transfer
        self.assertEqual(tx.preview_data["wait_band"]["new"],20)
        self.assertEqual(len(tx.preview_data["programme_changes"]),9)
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            self.assertTrue(tx.staged)
            self.assertTrue(self.win.unified_save.isEnabled())
            self.win.unified_save_action()
        self.assertTrue(tx.saved)
        self.assertTrue(tx.cmw_off)
        self.assertTrue(tx.receipt_file.exists())
        self.assertEqual(fake.c1[0x0021],20)
        self.assertEqual(sum(c[0]=="write" for c in fake.calls),9)
        self.assertEqual(
            [c for c in fake.calls if c[0]=="operation"],
            [("operation","00","01"),("operation","04","01"),
             ("operation","05","00"),("operation","00","00")])
        self.assertEqual(self.win.draft,{})
        self.assertIn("SAVED",self.win.transfer_summary.text())

    def test_combined_partial_write_never_saves_or_disables_cmw(self):
        from combined_transfer import CombinedTransfer
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        tx=CombinedTransfer(fake,self.win.session,self.dir.name)
        tx.preview(0,EXAMPLE,20)
        with patch.object(fake,"write1",side_effect=RuntimeError("Injected DA failure")):
            with self.assertRaisesRegex(RuntimeError,"Injected DA failure"):
                tx.stage()
        self.assertTrue(tx.ram_touched)
        self.assertTrue(self.win.session.ram_touched)
        self.assertFalse(tx.staged)
        self.assertFalse(tx.saved)
        self.assertNotIn(("operation","05","00"),fake.calls)
        self.assertNotIn(("operation","00","00"),fake.calls)
        with self.assertRaises(Exception):
            tx.save_finish()

    def test_combined_failed_cmw_after_save_does_not_issue_second_save(self):
        from combined_transfer import CombinedTransfer
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        tx=CombinedTransfer(fake,self.win.session,self.dir.name)
        tx.preview(0,EXAMPLE,20)
        tx.stage()
        original=fake.operation
        def failing_operation(code,data):
            if (code,data)==("00","00"):
                raise RuntimeError("Injected CMW OFF failure")
            return original(code,data)
        with patch.object(fake,"operation",side_effect=failing_operation):
            with self.assertRaisesRegex(RuntimeError,"Injected CMW OFF failure"):
                tx.save_finish()
        self.assertTrue(tx.saved)
        self.assertFalse(tx.cmw_off)
        self.assertTrue(tx.receipt_file.exists())
        self.assertEqual(sum(c==("operation","05","00") for c in fake.calls),1)
        with self.assertRaises(Exception):
            tx.save_finish()
        self.assertEqual(sum(c==("operation","05","00") for c in fake.calls),1)

    def test_combined_requires_explicit_programme_selection(self):
        self.win.connect_read()
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.draft={"C1:0021":20}
        self.win.show_step(4)
        self.assertEqual(self.win._active_transfer_kind(),"settings")
        self.win.toggle_programme_inclusion()
        self.assertEqual(self.win._active_transfer_kind(),"combined")
        self.win.draft["C3:0000"]=6
        self.win.refresh_actions()
        self.assertFalse(self.win.unified_preview.isEnabled())
        self.assertFalse(self.win.unified_stage.isEnabled())
        self.assertFalse(self.win.unified_save.isEnabled())

    def test_qt_settings_cannot_stage_two_unrelated_drafts(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.draft={"C1:0021":30,"C1:0026":500}
        self.win.show_step(3)
        self.win.refresh_actions()
        self.assertFalse(self.win.wt_preview.isEnabled())
        self.win.preview_wait()
        self.assertNotIn(("setting-write","C1",0x0021,30),fake.calls)

    def test_configuration_draft_disables_da_programme_write(self):
        self.win.connect_read()
        self.win.draft={"C3:0000":6}
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.show_step(4)
        self.win.preview()
        self.assertFalse(self.win.stage_button.isEnabled())
        self.assertFalse(self.win.save_button.isEnabled())
        fake=FakeOmron.created[-1]
        self.assertFalse(any(c[0]=="write" for c in fake.calls))

if __name__=="__main__":unittest.main()
