"""Experimental Omron Wait Band C1:0021 commissioning regression tests.

Simulated hardware only. No physical serial, mains or heater is ever used.
The tests prove the wire command allowlist, isolation preflight, baseline
integrity, read/verify/save separation, and failure-closed behaviour.
"""
from __future__ import annotations
import sys, tempfile, json, unittest
from pathlib import Path
from unittest.mock import Mock
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))

from compoway import SerialClient, ProtocolError
from transfer import TransferSession, PreflightError, PREFLIGHT
from settings_transfer import WaitBandTransfer, verify_wait_receipt


class FakeController:
    def __init__(self,wait_raw=0):
        self.write_allowed=True
        self.ram={"C1:0021":wait_raw}
        self.nv={"C1:0021":wait_raw}
        self.da=[[0]*150 for _ in range(8)]
        self.c3={x:expected for x,(expected,_) in PREFLIGHT.items()}
        self.actions=[]
        self.running=False
        self.reject_next=None
    def identify(self):return {"model10":"E5CC-TQX3A","buffer_bytes":217}
    def status(self):return "0000" if self.running else "0100"
    def read(self,bank,addr,count=1):
        if bank=="DA":return self.da[addr>>8][addr&255:addr&255+count]
        if bank=="C3":return [self.c3[addr+i] for i in range(count)]
        if bank=="C1":return [self.ram.get("C1:%04X"%(addr+i),0) for i in range(count)]
        raise AssertionError("Unexpected read bank")
    def read1(self,bank,addr):return self.read(bank,addr,1)[0]
    def write_setting(self,bank,addr,value):
        self.actions.append(("write",bank,addr,value))
        if self.reject_next=="write":
            self.reject_next=None
            raise ProtocolError("synthetic cable loss after attempted write")
        assert (bank,addr)==("C1",0x21)
        self.ram["C1:0021"]=value
    def operation(self,code,data):
        self.actions.append(("op",code,data))
        if self.reject_next==(code,data):
            self.reject_next=None
            raise ProtocolError("synthetic Omron operation error")
        if (code,data)==("05","00"):
            self.nv=self.ram.copy()
        if (code,data)==("00","00"):
            self.nv=self.ram.copy()
        return ""
    def reboot(self):
        self.ram=self.nv.copy()

class SettingsTests(unittest.TestCase):
    def prep(self,wait_raw=0):
        temp=tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        fake=FakeController(wait_raw)
        session=TransferSession(fake)
        session.preflight()
        session.backup(temp.name)
        tx=WaitBandTransfer(fake,session,temp.name)
        return fake,session,tx,temp.name

    def test_full_waitband_lifecycle(self):
        fake,session,tx,folder=self.prep()
        preview=tx.preview(30)
        self.assertEqual((preview["old_raw"],preview["new_raw"]),(0,30))
        self.assertTrue(tx.baseline_file.exists())
        self.assertFalse(any(x[0]=="write" for x in fake.actions))
        self.assertEqual(tx.stage(),30)
        self.assertTrue(tx.staged)
        self.assertEqual(fake.nv["C1:0021"],0)
        self.assertEqual(fake.ram["C1:0021"],30)
        self.assertIn(("op","00","01"),fake.actions)
        self.assertIn(("op","04","01"),fake.actions)
        self.assertEqual([x for x in fake.actions if x[0]=="write"],
                         [("write","C1",0x21,30)])
        self.assertFalse(tx.saved)
        receipt=tx.save()
        self.assertTrue(tx.saved)
        self.assertEqual(fake.nv["C1:0021"],30)
        self.assertEqual(json.loads(receipt.read_text())["written_raw"],30)
        self.assertEqual(sum(x==("op","05","00") for x in fake.actions),1)
        self.assertTrue(tx.disable_cmw())
        self.assertIn(("op","00","00"),fake.actions)
        with self.assertRaises(PreflightError):tx.save()
        with self.assertRaises(PreflightError):tx.stage()
        with self.assertRaises(PreflightError):tx.disable_cmw()
        fake.reboot()
        self.assertEqual(verify_wait_receipt(fake,receipt,session.info["model10"]),30)

    def test_write_permission_and_control_status(self):
        fake,_,tx,_=self.prep()
        fake.write_allowed=False
        with self.assertRaisesRegex(PreflightError,"Read-only"):tx.preview(30)
        fake.write_allowed=True
        fake.running=True
        with self.assertRaisesRegex(PreflightError,"stopped"):tx.preview(30)
        self.assertEqual(fake.actions,[])

    def test_only_readonly_after_snapshot_mismatch_and_no_double_stage(self):
        fake,_,tx,_=self.prep()
        tx.preview(30)
        fake.ram["C1:0021"]=12
        with self.assertRaisesRegex(PreflightError,"changed since preview"):tx.stage()
        self.assertEqual(fake.actions,[])
        self.assertFalse(tx.ram_touched)
        fake.ram["C1:0021"]=0
        tx.stage()
        with self.assertRaises(PreflightError):tx.stage()

    def test_partial_write_latches_uncertainty_and_no_save(self):
        fake,_,tx,_=self.prep()
        tx.preview(30)
        fake.reject_next="write"
        with self.assertRaises(ProtocolError):tx.stage()
        self.assertTrue(tx.ram_touched)
        self.assertFalse(tx.staged)
        with self.assertRaises(PreflightError):tx.stage()
        with self.assertRaises(PreflightError):tx.save()
        self.assertNotIn(("op","05","00"),fake.actions)

    def test_failed_readback_never_saves(self):
        fake,_,tx,_=self.prep()
        tx.preview(30)
        original=fake.read1
        def faulty(bank,addr):
            if bank=="C1" and tx.ram_touched:return 0
            return original(bank,addr)
        fake.read1=faulty
        with self.assertRaises(ProtocolError):tx.stage()
        with self.assertRaises(PreflightError):tx.save()

    def test_baseline_modified_on_disk_blocks_write(self):
        fake,_,tx,_=self.prep()
        tx.preview(30)
        tx.baseline_file.write_text("{}")
        with self.assertRaises(PreflightError):tx.stage()
        self.assertEqual(fake.actions,[])

    def test_out_of_bounds_identical_or_wrong_model(self):
        fake,_,tx,_=self.prep()
        for raw in (-1,10000,3.5,True):
            with self.assertRaises(PreflightError):tx.preview(raw)
        with self.assertRaisesRegex(PreflightError,"no write needed"):tx.preview(0)
        fake2,main2,tx2,_=self.prep()
        main2.mismatches=["Wrong configuration"]
        with self.assertRaises(PreflightError):tx2.preview(30)

    def test_cannot_mix_with_da_programme(self):
        fake,session,tx,_=self.prep()
        session.ram_touched=True
        with self.assertRaisesRegex(PreflightError,"DA programme"):tx.preview(30)

    def test_raw_one_register_command_only(self):
        client=SerialClient.__new__(SerialClient)
        client.write_allowed=True
        commands=[]
        client.query=lambda command:commands.append(command) or ""
        client.write_setting("C1",0x0021,30)
        self.assertEqual(commands,["0102C100210000010000001E"])
        for bank,addr in [("C3",0x0021),("C1",0x0022),("DA",0x0021)]:
            with self.assertRaises(PermissionError):client.write_setting(bank,addr,30)
        for wrong in (-1,10000,None,3.5):
            with self.assertRaises(ValueError):client.write_setting("C1",0x21,wrong)
        client.write_allowed=False
        with self.assertRaises(PermissionError):client.write_setting("C1",0x21,30)
        self.assertEqual(commands,["0102C100210000010000001E"])

if __name__=="__main__":unittest.main()
