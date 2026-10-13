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
        self.assertEqual(len(self.ui.readbook.tabs()),4)
        self.assertFalse(self.ui.connected)
        self.ui.wizard_next()
        self.assertEqual(self.ui.book.index("current"),2)
        self.assertFalse(self.ui.safe_to_stage())
    def test_connected_read_backup_and_setup_callbacks_do_not_crash(self):
        """Replay the user's broken COM7 wizard path without opening a real serial port."""
        import app
        from transfer import PREFLIGHT
        from program_model import Segment
        class FakeUSB:
            def __init__(self,*args,**kwargs):
                self.c3={address:value for address,(value,_) in PREFLIGHT.items()}
                self.closed=False
                self.calls=[]
                self.da=[[0]*150 for _ in range(8)]
                self.da[0][0]=1
                self.da[0][0x16]=0
                self.da[0][0x17]=50
                self.da[0][0x18]=0
                self.da[0][0x0F]=0xFFFFFFFF
                for bank in self.da[1:]:
                    bank[0]=1
                    bank[0x16]=0
                    bank[0x17]=50
                    bank[0x18]=0
                    bank[0x0F]=0xFFFFFFFF
            def identify(self):return {"model10":"E5CC-TQX3A","buffer_bytes":217}
            def status(self):return "0100"
            def read1(self,kind,address):return self.read(kind,address,1)[0]
            def read(self,kind,address,count=1):
                self.calls.append(("READ",kind,address,count))
                if kind=="C3":
                    return [self.c3[address+i] for i in range(count)]
                if kind=="DA":
                    return self.da[address>>8][address&255:(address&255)+count]
                raise RuntimeError("Optional device setting not fitted")
            def close(self):self.closed=True
            def write1(self,*args):raise AssertionError("READ-ONLY path unexpectedly wrote device")
            def operation(self,*args):raise AssertionError("READ-ONLY path unexpectedly sent operation")
        self.ui.choose_mode("connected")
        self.ui.port.set("COM7")
        def immediate_job(label, work, callback, write=False):
            out=work()
            callback(out)
        self.ui._job=immediate_job
        with tempfile.TemporaryDirectory() as folder,\
             patch.object(app,"SerialClient",FakeUSB),\
             patch("tkinter.messagebox.showinfo"):
            self.ui.backdir.set(folder)
            self.assertEqual(self.ui.btn_connect.cget("text"),"CONNECT + READ EVERYTHING")
            self.ui.btn_connect.invoke()
            self.assertTrue(self.ui.connected)
            self.assertEqual(self.ui.connection_state.get(),"USB CONNECTED · COM7")
            self.assertIsNotNone(self.ui.session.backup_data)
            self.assertEqual(len(self.ui.session.backup_data["programmes"]),8)
            self.assertEqual(self.ui.setup_snapshot["fields"]["C3:0000"],5)
            self.assertEqual(self.ui.readbook.select(),str(self.ui.t_initial_view))
            self.assertEqual(self.ui.book.index("current"),1)
            self.assertTrue(list(Path(folder).glob("*programme-backup*.json")))
            self.assertTrue(list(Path(folder).glob("*initial-settings*.json")))
            self.assertEqual(self.ui.session.client.calls[0][0],"READ")
            self.assertFalse(self.ui.lab_mode)
    def test_hardware_action_buttons_stay_before_checklist(self):
        self.ui.choose_mode("connected")
        self.ui.book.select(self.ui.t_upload)
        self.ui.review_current_plan()
        self.assertEqual(self.ui.btn_preview.winfo_manager(),"pack")
        self.assertEqual(self.ui.btn_stage.winfo_manager(),"pack")
        self.assertEqual(self.ui.btn_commit.winfo_manager(),"pack")
        self.assertIn("Not connected",self.ui.upload_blocker.get())
        self.assertFalse(self.ui.safe_to_stage())
    def test_stage_requires_preview_and_blocks_stale_profile(self):
        """A changed local design invalidates the reviewed register plan."""
        from types import SimpleNamespace
        class Plan:
            backup_data={"programmes":{"0":["00000000"]*150}}
            staged=None
            mismatches=[]
            status="0100"
            def build_plan(self,slot,programme):
                return [(0x0017,50,int(float(programme.steps[0].sp)))]
        self.ui.choose_mode("connected")
        self.ui.lab_mode=True
        self.ui.connected=True
        self.ui.session=Plan()
        for var in self.ui.check_vars:var.set(True)
        self.ui.refresh_buttons()
        self.assertFalse(self.ui.safe_to_stage())
        with patch("tkinter.messagebox.showinfo"):
            self.ui.preview()
        self.assertTrue(self.ui.safe_to_stage())
        self.ui.progs[0].steps[0].sp="130"
        with patch("tkinter.messagebox.showwarning") as warning,\
             patch("tkinter.messagebox.askyesno",return_value=False):
            self.ui.stage()
        warning.assert_called_once()
        self.assertFalse(self.ui.safe_to_stage())
    def test_unplugged_com_port_auto_disconnects_without_erasing_design(self):
        """When Windows removes COM7 the GUI must lose write capability automatically."""
        from types import SimpleNamespace
        class DummyUSB:
            def __init__(self):self.closed=False
            def close(self):self.closed=True
        client=DummyUSB()
        self.ui.choose_mode("connected")
        self.ui.client=client
        self.ui.session=SimpleNamespace(ram_touched=False,committed=True,backup_data={"programmes":{}})
        self.ui.connected=True
        self.ui.active_port="COM7"
        self.ui.approved_preview=("old",0,())
        before=self.ui.progs[0].as_json()
        with patch("serial.tools.list_ports.comports",return_value=[]):
            self.ui._poll_connection()
        self.assertFalse(self.ui.connected)
        self.assertTrue(client.closed)
        self.assertIsNone(self.ui.session)
        self.assertIsNone(self.ui.approved_preview)
        self.assertIn("USB DISCONNECTED",self.ui.status.get())
        self.assertEqual(self.ui.connection_state.get(),"USB DISCONNECTED")
        self.assertFalse(self.ui.safe_to_stage())
        self.assertEqual(self.ui.progs[0].as_json(),before)
    def test_unplugging_only_controller_end_detects_missing_heartbeat(self):
        """COM port may remain enumerated if the PC-side USB adaptor remains."""
        from types import SimpleNamespace
        class LostController:
            closed=False
            def close(self):self.closed=True
            def status(self):raise RuntimeError("No response from controller")
        client=LostController()
        self.ui.choose_mode("connected")
        self.ui.client=client
        self.ui.session=SimpleNamespace(ram_touched=False,committed=False)
        self.ui.connected=True
        self.ui.active_port="COM7"
        self.ui._connection_poll_counter=3
        def fake_job(label,fn,success,write=False,quiet=False):
            self.assertEqual(label,"USB connection health check")
            self.assertTrue(quiet)
            try:success(fn())
            except Exception as exc:self.ui.events.put(("ERROR",(label,str(exc),False,"simulated")))
        self.ui._job=fake_job
        with patch("serial.tools.list_ports.comports",return_value=[SimpleNamespace(device="COM7")]):
            self.ui._poll_connection()
        with patch("tkinter.messagebox.showerror"):
            self.ui._pump()
        self.assertFalse(self.ui.connected)
        self.assertTrue(client.closed)
        self.assertIn("USB DISCONNECTED",self.ui.status.get())
    def test_uncommitted_ram_unplug_shows_safety_warning(self):
        from types import SimpleNamespace
        self.ui.choose_mode("connected")
        self.ui.connected=True
        self.ui.active_port="COM7"
        self.ui.session=SimpleNamespace(ram_touched=True,committed=False)
        self.ui.client=SimpleNamespace(close=lambda:None)
        with patch("tkinter.messagebox.showwarning") as warn:
            self.ui._connection_lost("Controller power lost")
        warn.assert_called_once()
        self.assertFalse(self.ui.connected)
        self.assertFalse(self.ui.safe_to_stage())
        self.assertIn("DISCONNECTED",self.ui.status.get())
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
