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
        self.area=0
        self.calls=[]
        self.c3={addr:expected for addr,(expected,_) in PREFLIGHT.items()}
        self.c3[0x0005]=1300
        self.c3[0x0006]=0xffffff38
        self.c1={0x0015:120,0x0016:100,0x0017:40,0x001B:20,0x0021:0}
        self.c5={16:100,19:1000,20:0}
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
        if bank=="C0" and addr==0x000D:return [1]
        if bank=="C5":
            return [self.c1.get({0:0x0015,1:0x0016,2:0x0017}.get(addr+i,-1),0)
                    if addr+i in (0,1,2) else self.c5.get(addr+i,0) for i in range(count)]
        return [0 for _ in range(count)]
    def read1(self,bank,addr):return self.read(bank,addr,1)[0]
    def write1(self,addr,value):
        assert self.write_allowed,"A disabled lab session attempted a write!"
        self.calls.append(("write","DA",addr,value))
        self.da[addr>>8][addr&255]=value&0xffffffff
    def write_setting(self,bank,addr,value):
        assert self.write_allowed
        from c1_transfer import check_value
        if bank=="C3":
            from c3_transfer import check_setting
            assert self.area==1
            check_setting(f"C3:{addr:04X}",value)
            self.c3[addr]=value
        elif bank=="C5":
            from c5_transfer import check_value as c5_check_value
            c5_check_value(f"C5:{addr:04X}",value)
            self.c5[addr]=value
        else:
            assert bank=="C1"
            check_value(f"C1:{addr:04X}",value)
            self.c1[addr]=value
        self.calls.append(("setting-write",bank,addr,value))
    def operation(self,code,data):
        assert self.write_allowed
        assert (code,data) in {("00","01"),("00","00"),("04","01"),("05","00"),("07","00")}
        if (code,data)==("07","00"):self.area=1
        self.calls.append(("operation",code,data))
        return ""
    def software_reset(self):
        assert self.write_allowed
        self.calls.append(("software_reset",))
        self.area=0
        # Simulated controller internal setpoint-range adjustment on sensor
        # change; programme memory is deliberately retained unchanged.
        if self.c3.get(0)==6:
            self.c3[0x0005]=5000
        return None
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
        # Automated tests must acknowledge the real UI safety guard for
        # simulated uncommitted RAM. Production confirmation is unchanged.
        with patch.object(QMessageBox,"question",return_value=QMessageBox.StandardButton.Yes):
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
        self.assertEqual(self.win.inventory["fields"]["C5:0000"],120)
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
            tx=self.win.setting_transfer
            original=self.win.session
            self.win.unified_save_action()
        self.assertTrue(tx.saved)
        self.assertTrue(tx.cmw_off)
        self.assertIsNone(self.win.setting_transfer)
        self.assertIsNot(original,self.win.session)
        self.assertFalse(self.win.session.committed)
        self.assertEqual(self.win.last_completed_transfer["kind"],"wait")
        self.assertEqual(self.win.draft,{})
        self.assertEqual(
            [c for c in fake.calls if c[0]=="operation"],
            [("operation","00","01"),("operation","04","01"),
             ("operation","05","00"),("operation","00","00")])

    def test_programme_save_allows_next_c3_preview_without_cycle(self):
        from hardware_profile import confirm_model
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.hardware_profile=confirm_model("E5CC-TQX3A5M-000","E5CC-TQX3A")
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.show_step(4)
        self.win.unified_preview_action()
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            self.win.unified_save_action()
        self.assertEqual(fake.calls.count(("software_reset",)),0)
        self.assertEqual(self.win.session.settings["C3:0000"],5)
        self.win.draft={"C3:0000":6}
        self.win.refresh_actions()
        self.assertTrue(self.win.unified_preview.isEnabled())
        self.win.unified_preview_action()
        self.assertIsNotNone(self.win.c3_transfer)
        self.assertEqual(self.win.c3_transfer.preview_data["changes"][0]["register"],"C3:0000")
        self.assertEqual(fake.calls.count(("software_reset",)),0)

    def test_failed_post_save_readback_keeps_original_session_locked(self):
        self.win.connect_read()
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.show_step(4)
        self.win.unified_preview_action()
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            old=self.win.session
            with patch.object(self.win,"_read_fresh_baseline",
                              side_effect=RuntimeError("Synthetic readback interruption")):
                with self.assertRaisesRegex(RuntimeError,"Synthetic readback interruption"):
                    self.win.unified_save_action()
        self.assertTrue(old.committed)
        self.assertTrue(old.communications_write_disabled)
        self.assertIs(self.win.session,old)
        self.assertIsNone(self.win.last_completed_transfer)
        self.assertEqual(len(list(Path(self.dir.name).glob("*upload-receipt*"))),1)

    def test_prior_programme_save_explains_disabled_c3_preview(self):
        from PySide6.QtWidgets import QScrollArea
        self.win.connect_read()
        self.win.show_step(4)
        self.win.show()
        QApplication.processEvents()
        self.assertIsInstance(self.win.apply_tabs.widget(1),QScrollArea)
        self.assertIs(self.win.transfer_scroll.widget(),self.win.unified_preview.parentWidget())
        self.win.draft={"C3:0000":6}
        self.win.session.committed=True
        self.win.refresh_actions()
        self.assertFalse(self.win.unified_preview.isEnabled())
        self.assertIn("previous programme SAVE",self.win.transfer_block_reason.text())
        self.assertIn("power-cycle",self.win.transfer_block_reason.text())
        self.assertIn("Connect + Read Everything",self.win.usb_next_action.text())
        self.assertIn("previous programme SAVE",self.win.unified_preview.toolTip())
        # A fresh transfer state is now eligible; no write or USB calls here.
        self.win.session.committed=False
        self.win.refresh_actions()
        self.assertTrue(self.win.unified_preview.isEnabled())
        self.assertFalse(self.win.transfer_block_reason.isVisible())

    def test_healthy_heartbeat_is_silent_without_button_or_message_flicker(self):
        """Use the actual Qt worker/signal path, not the test's normal _work stub."""
        self.win.connect_read()
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.show_step(4)
        self.assertTrue(self.win.unified_preview.isEnabled())
        self.assertTrue(self.win.btn_read.isEnabled())
        initial=(self.win.unified_preview.isEnabled(),
                 self.win.btn_read.isEnabled(),
                 self.win.usb_next_action.text(),
                 self.win.transfer_request_status.text())
        log_count=len(self.win.audit_entries)
        self.win._work=Studio._work.__get__(self.win,Studio)
        class InlinePool:
            def start(self,task):
                task.run()
        self.win.pool=InlinePool()
        with patch("qt_app.serial_ports",return_value=["COM7"]):
            with patch.object(self.win,"_controls",wraps=self.win._controls) as updates:
                for _ in range(4):
                    self.win._monitor_connection()
                self.assertEqual(updates.call_count,0)
        self.assertFalse(self.win.busy)
        self.assertEqual(len(self.win.audit_entries),log_count)
        self.assertEqual(initial,(self.win.unified_preview.isEnabled(),
                                  self.win.btn_read.isEnabled(),
                                  self.win.usb_next_action.text(),
                                  self.win.transfer_request_status.text()))

    def test_heartbeat_empty_response_still_disconnects(self):
        self.win.connect_read()
        self.win.show_step(4)
        self.win._work=Studio._work.__get__(self.win,Studio)
        class InlinePool:
            def start(self,task):
                task.run()
        self.win.pool=InlinePool()
        client=self.win.client
        with patch("qt_app.serial_ports",return_value=["COM7"]):
            with patch.object(client,"status",return_value=""):
                for _ in range(4):
                    self.win._monitor_connection()
        self.assertIsNone(self.win.client)
        self.assertIsNone(self.win.session)
        self.assertFalse(self.win.busy)
        self.assertIn("USB disconnected",self.win.link_status.text())
        self.assertFalse(self.win.unified_preview.isEnabled())
        self.assertFalse(self.win.btn_disconnect.isEnabled())

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
            original=self.win.session
            self.win.unified_save_action()
        self.assertTrue(original.committed)
        self.assertTrue(original.communications_write_disabled)
        self.assertTrue(original.receipt_file.exists())
        self.assertIsNot(self.win.session,original)
        self.assertFalse(self.win.session.committed)
        self.assertEqual(self.win.last_completed_transfer["kind"],"programme")
        self.assertTrue(self.win.session.backup_file.exists())
        self.assertNotEqual(self.win.session.backup_file,original.backup_file)
        self.assertEqual(sum(c==("operation","05","00") for c in fake.calls),1)
        self.assertEqual(sum(c==("operation","00","00") for c in fake.calls),1)

    def test_fixed_pid_bank_two_is_written_without_active_pid_switch(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        fake.c3[0x0007]=1
        self.win.draft={"C5:0010":140}
        self.win.show_step(4)
        self.assertEqual(self.win._active_transfer_kind(),"c5")
        self.assertTrue(self.win.unified_preview.isEnabled())
        self.win.unified_preview_action()
        self.assertTrue(self.win.unified_stage.isEnabled())
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            self.assertTrue(self.win.c5_transfer.staged)
            tx=self.win.c5_transfer
            self.win.unified_save_action()
        self.assertEqual(fake.c5[16],140)
        self.assertTrue(tx.cmw_off)
        self.assertIsNone(self.win.c5_transfer)
        self.assertEqual(self.win.last_completed_transfer["kind"],"c5")
        self.assertEqual(fake.calls.count(("operation","05","00")),1)
        self.assertFalse(any(c[0]=="write" and c[1]=="DA" for c in fake.calls))

    def test_unified_controls_never_write_unqualified_configuration(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.draft={"C3:0011":4}  # serial baud needs dedicated reconnection logic
        self.win.show_step(4)
        self.assertFalse(self.win.unified_preview.isEnabled())
        self.assertFalse(self.win.unified_stage.isEnabled())
        self.assertFalse(self.win.unified_save.isEnabled())
        self.win.unified_preview_action()
        self.win.unified_stage_action()
        self.win.unified_save_action()
        self.assertFalse(any(c[0] in ("write","setting-write") for c in fake.calls))

    def test_combined_option_hidden_except_when_both_transfers_are_proposed(self):
        # Reading alone must not display a giant disabled combined-transfer control.
        self.win.show_step(4)
        self.assertTrue(self.win.include_programme_button.isHidden())
        self.win.connect_read()
        self.win.show_step(4)
        self.assertTrue(self.win.include_programme_button.isHidden())

        # A Wait Band proposal alone is not a combined programme transfer.
        self.win.draft={"C1:0021":20}
        self.win.refresh_actions()
        self.assertTrue(self.win.include_programme_button.isHidden())

        # A local programme without a Wait Band proposal also does not need it.
        self.win.programmes[0]=EXAMPLE
        self.win._render_programme()
        self.win.draft={}
        self.win.refresh_actions()
        self.assertTrue(self.win.include_programme_button.isHidden())

        # C3 configuration changes must never advertise DA+Wait Band inclusion.
        self.win.draft={"C3:0000":6}
        self.win.refresh_actions()
        self.assertTrue(self.win.include_programme_button.isHidden())

        # It becomes available only for a changed programme plus Wait Band.
        self.win.draft={"C1:0021":20}
        self.win.refresh_actions()
        self.assertFalse(self.win.include_programme_button.isHidden())
        self.assertTrue(self.win.include_programme_button.isEnabled())
        self.win.toggle_programme_inclusion()
        self.assertIn("ON",self.win.include_programme_button.text())

        # Preserve a previously selected inclusion visibly if the draft changes
        # to an invalid combination, so the operator can turn it back OFF.
        self.win.draft={"C3:0000":6}
        self.win.refresh_actions()
        self.assertFalse(self.win.include_programme_button.isHidden())
        self.win.toggle_programme_inclusion()
        self.assertTrue(self.win.include_programme_button.isHidden())

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
        messages=[]
        self.win.message=lambda title,body,*unused: messages.append((title,body))
        self.win.unified_preview_action()
        self.assertIn("°C\nProgramme",messages[-1][1])
        self.assertNotIn(r"\n",messages[-1][1])
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
        self.assertEqual(self.win.last_completed_transfer["kind"],"combined")
        self.assertIn("SAVE + CMW OFF",self.win.transfer_request_status.text())

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

    def test_global_c3_control_algorithm_usb_transfer_and_receipt(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.draft={"C3:0007":1}
        self.win.show_step(4)
        self.assertEqual(self.win._active_transfer_kind(),"c3")
        self.assertTrue(self.win.unified_preview.isEnabled())
        self.win.unified_preview_action()
        tx=self.win.c3_transfer
        self.assertEqual(tx.preview_data["changes"][0]["register"],"C3:0007")
        self.assertTrue(self.win.unified_stage.isEnabled())
        self.assertIn("area 1",self.win.unified_stage.text())
        def reopen(port,write_allowed=False):
            self.assertEqual(port,"COM7")
            self.assertFalse(write_allowed)
            fake.closed=False
            return fake
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            self.assertTrue(tx.staged)
            self.assertTrue(self.win.unified_save.isEnabled())
            self.assertIn("Return to normal",self.win.unified_save.text())
            with patch("qt_app.SerialClient",side_effect=reopen):
                self.win.unified_save_action()
        self.assertTrue(tx.finished)
        self.assertTrue(tx.cmw_off)
        self.assertTrue(tx.receipt_file.is_file())
        self.assertEqual(fake.c3[7],1)
        self.assertNotIn(("operation","05","00"),fake.calls)
        self.assertEqual(fake.calls.count(("software_reset",)),1)
        self.assertEqual(fake.area,0)
        self.assertEqual(self.win.draft,{})
        self.assertIsNone(self.win.session) # fresh read required before next write
        self.assertIsNotNone(tx.restart_audit)
        self.assertTrue(tx.restart_audit["configuration_verified"])
        self.assertFalse(self.win.restart_c3_button.isEnabled())

    def test_sensor_change_with_populated_memories_previews_with_complete_backup(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.draft={"C3:0000":6}
        self.win.show_step(4)
        self.assertEqual(self.win._active_transfer_kind(),"c3")
        self.assertTrue(self.win.unified_preview.isEnabled())
        seen=[]
        self.win.message=lambda title,detail,*unused:seen.append((title,detail))
        self.win.unified_preview_action()
        self.assertTrue(seen)
        self.assertIn("ONLY the selected sensor input register",seen[-1][1])
        self.assertIn("no DA programme memory",seen[-1][1])
        self.assertNotIn("50 °C → 5 °C",seen[-1][1])
        self.assertTrue(self.win.c3_transfer.preview_data["sensor_change"])
        self.assertEqual(len(self.win.c3_transfer.session.backup_data["programmes"]),8)
        self.assertEqual(fake.area,0)
        self.assertFalse(any(c[0]=="setting-write" for c in fake.calls))

    def test_clamped_target_can_be_copied_repaired_and_only_then_uploaded(self):
        """Input 5: after sensor switch, 2000 raw was clamped to 1300 raw.
        The local copy must never validate against fallback input-6 limits.
        """
        import json
        from program_model import planned_writes,ValidationError
        from programme_constraints import effective_limits
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        # Populate controller memory with the exact photographed profile.
        fake.da[0][0]=2
        fake.da[0][0x16]=0   # ramp
        fake.da[0][0x17]=1300
        fake.da[0][0x18]=20
        fake.da[0][0x1a]=1   # soak
        fake.da[0][0x1d]=8   # 8 minutes
        self.win.session.backup_data["programmes"]["0"]=[
            f"{raw:08X}" for raw in fake.da[0]]
        self.win.backup=self.win.session.backup_data
        self.win.session.backup_file.write_text(
            json.dumps(self.win.backup,indent=2),encoding="utf-8")
        self.win._populate_memories()
        self.assertIn("1300",self.win.memory_table.item(0,2).text())
        self.win.show_step(1)
        with patch.object(QMessageBox,"question",return_value=QMessageBox.StandardButton.Yes):
            self.win.copy_stored()
        self.assertEqual(self.win._current_step,2)
        self.assertEqual(self.win.programmes[0].steps[0].sp,"1300.0")
        self.assertEqual(float(self.win.programmes[0].steps[0].rate),20.0)
        self.assertEqual(self.win.programmes[0].steps[1].minutes,"8")
        self.assertEqual(self.win.segment_table.cellWidget(0,0).target.spin.value(),1300)
        self.assertIsNone(self.win.planned_sensor_by_slot[0])
        self.assertIsNone(self.win.editor_sensor.currentData())
        self.assertFalse(any(c[0]=="write" for c in fake.calls))
        self.assertFalse(any(c[0]=="setting-write" for c in fake.calls))

        # A lower *actual* SP upper limit must not prevent editing the copy,
        # but MUST prevent encoding it for USB transfer.
        limited=dict(self.win.inventory["fields"])
        limited["C3:0005"]=500
        limits=effective_limits(limited,require_readback=True)
        with self.assertRaisesRegex(ValidationError,"outside permitted"):
            planned_writes(0,self.win.programmes[0],input_type=5,limits=limits)
        self.win.programmes[0].steps[0].sp="200"
        self.assertIn(
            200,dict(planned_writes(
                0,self.win.programmes[0],input_type=5,limits=limits)).values())

    def test_global_sensor_proposal_does_not_reinterpret_editor_or_upload_DA(self):
        import copy
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.programmes[0]=copy.deepcopy(EXAMPLE)
        self.win._render_programme()
        previous=tuple((seg.type,float(seg.sp)) for seg in
                       self.win.programmes[0].steps if seg.type!="soak")
        limits,before_error=self.win._effective_programme_limits()
        self.assertIsNone(before_error)
        self.assertEqual(limits.input_type,5)
        self.win.draft={"C3:0000":6}
        self.win.refresh_review()
        now,error=self.win._effective_programme_limits()
        self.assertIsNone(error)
        self.assertEqual(now.input_type,5) # proposal is NOT active hardware
        self.assertEqual(
            tuple((seg.type,float(seg.sp)) for seg in
                  self.win.programmes[0].steps if seg.type!="soak"),
            previous)
        self.win.unified_preview_action()
        def reopen(port,write_allowed=False):
            self.assertEqual(port,"COM7")
            self.assertFalse(write_allowed)
            fake.closed=False
            return fake
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            with patch("qt_app.SerialClient",side_effect=reopen):
                self.win.finish_c3()
        self.assertEqual(fake.calls.count(("software_reset",)),1)
        self.assertEqual(
            tuple((seg.type,float(seg.sp)) for seg in
                  self.win.programmes[0].steps if seg.type!="soak"),
            previous)
        self.assertFalse(self.win.inventory_current_session)
        held,stale=self.win._effective_programme_limits()
        self.assertEqual(held.input_type,5)
        self.assertIn("stale",stale)
        self.assertEqual([call for call in fake.calls if call[0]=="write"],[])
        self.assertEqual([call for call in fake.calls if call[0]=="setting-write"],
                         [("setting-write","C3",0,6)])

    def test_pending_sensor_setting_warns_without_changing_graph_or_local_target(self):
        import copy
        self.win.connect_read()
        self.win.programmes[0]=copy.deepcopy(EXAMPLE)
        self.win.programmes[0].steps[0].sp="800"
        self.win._render_programme()
        before=tuple((seg.type,float(seg.sp)) for seg in
                     self.win.programmes[0].steps if seg.type!="soak")
        self.win.draft={"C3:0000":6}
        self.win.refresh_review()
        lim,error=self.win._effective_programme_limits()
        self.assertIsNone(error)
        self.assertEqual(lim.input_type,5)
        self.assertEqual(
            tuple((seg.type,float(seg.sp)) for seg in
                  self.win.programmes[0].steps if seg.type!="soak"),
            before)
        self.assertIn("PENDING GLOBAL SETTINGS",self.win.apply_details.toPlainText())
        self.assertIn("800",self.win.apply_details.toPlainText())
        self.win._graph_current()
        self.assertIn("PENDING GLOBAL SETTING",self.win.temperature_limits_hint.text())
        self.assertIn("800",self.win.temperature_limits_hint.text())

    def test_c3_software_restart_reconnects_and_audits_all_memories(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        self.win.draft={"C3:0000":6}
        self.win.show_step(4)
        self.win.unified_preview_action()
        tx=self.win.c3_transfer
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            tx.finish()  # emulate an already-finished transfer from an older build
            self.win.refresh_actions()  # fallback return-to-normal remains available
        self.assertTrue(tx.finished)
        self.assertTrue(self.win.restart_c3_button.isEnabled())
        # The test reuses one simulated controller: its settings/memories
        # persist across serial connection close and read-only reconnect.
        def reopen(port,write_allowed=False):
            self.assertFalse(write_allowed)
            self.assertEqual(port,"COM7")
            fake.closed=False
            return fake
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            with patch("qt_app.SerialClient",side_effect=reopen):
                self.win.restart_verify_c3()
        self.assertEqual(fake.calls.count(("software_reset",)),1)
        audit=tx.restart_audit
        self.assertEqual(audit["memory_words_compared"],1200)
        self.assertEqual(audit["changes_total"],0)
        self.assertTrue(audit["configuration_verified"])
        self.assertTrue(audit["requires_manual_review"]) # precision changed
        self.assertTrue(Path(audit["audit_file"]).is_file())
        self.assertIsNone(self.win.session)  # mandatory fresh normal read
        self.assertFalse(self.win.restart_c3_button.isEnabled())
        self.win.restart_verify_c3()
        self.assertEqual(fake.calls.count(("software_reset",)),1)

    def test_unified_c1_pid_and_wait_transfer_one_save(self):
        self.win.connect_read()
        fake=FakeOmron.created[-1]
        fake.c3[0x0007]=1    # PID mode
        self.win.inventory["fields"]["C3:0007"]=1
        self.win.draft={"C1:0015":140,"C1:0021":30}
        self.win.show_step(4)
        self.assertEqual(self.win._active_transfer_kind(),"c1")
        self.assertTrue(self.win.unified_preview.isEnabled())
        self.win.unified_preview_action()
        tx=self.win.c1_transfer
        self.assertEqual(len(tx.preview_data["changes"]),2)
        self.assertTrue(self.win.unified_stage.isEnabled())
        with patch.object(QMessageBox,"warning",return_value=QMessageBox.StandardButton.Yes):
            self.win.unified_stage_action()
            self.assertTrue(tx.staged)
            self.assertTrue(self.win.unified_save.isEnabled())
            self.win.unified_save_action()
        self.assertTrue(tx.cmw_off)
        self.assertTrue(tx.receipt_file.is_file())
        self.assertEqual(fake.c1[0x0015],140)
        self.assertEqual(fake.c1[0x0021],30)
        self.assertEqual(fake.calls.count(("operation","05","00")),1)
        self.assertEqual(self.win.draft,{})
        self.assertIsNone(self.win.c1_transfer)
        self.assertEqual(self.win.last_completed_transfer["kind"],"c1")
        self.assertIn("SAVE + CMW OFF",self.win.transfer_request_status.text())

    def test_unqualified_c3_parameter_blocks_all_c1_writes(self):
        self.win.connect_read()
        self.win.draft={"C1:0015":140,"C3:0000":6}
        self.win.show_step(4)
        self.assertEqual(self.win._active_transfer_kind(),"c3")
        self.assertFalse(self.win.unified_preview.isEnabled())
        self.assertFalse(self.win.unified_stage.isEnabled())
        self.assertFalse(self.win.unified_save.isEnabled())
        self.assertIsNone(self.win.c1_transfer)

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
