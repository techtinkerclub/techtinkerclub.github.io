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
        return [0 for _ in range(count)]
    def read1(self,bank,addr):return self.read(bank,addr,1)[0]
    def write1(self,addr,value):
        assert self.write_allowed,"A disabled lab session attempted a write!"
        self.calls.append(("write","DA",addr,value))
        self.da[addr>>8][addr&255]=value&0xffffffff
    def operation(self,code,data):
        assert self.write_allowed
        assert (code,data) in {("00","01"),("04","01"),("05","00")}
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
        for check in self.win.safety:check.setChecked(True)
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
