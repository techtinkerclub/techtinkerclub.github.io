"""Modern, self-contained E5CC-T Studio (PySide6 + PyQtGraph).

This GUI deliberately reuses the already-tested backend modules. It does not
write any C0/C1/C3/C4/C5/C9 configuration register. The only hardware write
route is the existing safety-gated DA transfer, and only when explicitly
launched with --enable-lab-writes. Run in offline mode without a controller.
"""
from __future__ import annotations

import argparse
import copy
from datetime import datetime,timezone
import hashlib
import json
from pathlib import Path
import sys
import webbrowser

from PySide6.QtCore import Qt, QTimer, QThreadPool
from PySide6.QtGui import QColor, QFont
from PySide6.QtWidgets import (
    QApplication,QMainWindow,QWidget,QFrame,QVBoxLayout,QHBoxLayout,QGridLayout,
    QLabel,QPushButton,QLineEdit,QComboBox,QSpinBox,QDoubleSpinBox,QTextEdit,
    QTableWidget,QTableWidgetItem,QAbstractItemView,QHeaderView,QFileDialog,
    QMessageBox,QSplitter,QTabWidget,QCheckBox,QStackedWidget,QProgressBar,QScrollArea
)
from serial.tools import list_ports

from qt_components import STYLE,Task,Profile,card,heading,text,button,StudioCombo,form_field
from qt_segment_row import SegmentRow,Stepper
from compoway import SerialClient
from transfer import TransferSession
from program_model import Programme,Segment,blank_programme,ValidationError
from backup_explorer import load_backup,decode_slot,profile_points,summary_as_plaintext
from controller_setup import read_snapshot,report as setup_report,write_new_json,validate_snapshot
from controller_inventory import (
    CATALOG,group_names,offline_inventory,read_inventory,validate_inventory,readable_rows,
    human_value,add_proposal,proposal_report,report_inventory
)
from config_change_review import build_review,readable_review
from qt_manual import save_manual
from qt_entry_plan import make_entry_plan,plain_instructions

STEPS=["1   Mode","2   Read & Backup","3   Programme",
       "4   Initial Settings","5   Apply / Manual"]
EXAMPLE=Programme(
    name="120 °C / 50 °C four-segment example",start="20",finish="rst",
    steps=[Segment("ramp",sp="120",rate="2"),Segment("soak",minutes="15"),
           Segment("ramp",sp="50",rate="2"),Segment("soak",minutes="15")])

def save_json_fresh(folder,tag,payload):
    path=Path(folder)
    path.mkdir(parents=True,exist_ok=True)
    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    output=path/f"E5CC-T-{tag}-{stamp}.json"
    write_new_json(output,payload)
    return output

def serial_ports():
    return [item.device for item in list_ports.comports()]


class Studio(QMainWindow):
    def __init__(self,enable_lab_writes=False):
        super().__init__()
        self.lab=bool(enable_lab_writes)
        self.mode="connected"
        self.offline_inspect_saved=False
        self.client=None
        self.session=None
        self.port=None
        self.backup=None
        self.snapshot=None
        self.inventory=offline_inventory()
        self.inventory_current_session=False
        self.draft={}
        self.programmes=[blank_programme() for _ in range(8)]
        self.slot=0
        self.preview_stamp=None
        self.preview_changes=[]
        self.fail_latched=False
        self.busy=False
        self.workers=set()
        self.audit_entries=[]
        self.pool=QThreadPool(self)
        self.pool.setMaxThreadCount(1)   # one serial operation at a time
        self._rendering=False
        self._current_step=0
        self._heartbeat_tick=0
        self.setWindowTitle("E5CC-T Programme Studio · Modern Desktop")
        self.resize(1390,875)
        self.setMinimumSize(1050,690)
        self.setStyleSheet(STYLE)
        self._make_ui()
        self.refresh_ports()
        self.show_step(0)
        self.connection_timer=QTimer(self)
        self.connection_timer.timeout.connect(self._monitor_connection)
        self.connection_timer.start(1800)

    def _make_ui(self):
        root=QWidget();root.setObjectName("root")
        self.setCentralWidget(root)
        main=QVBoxLayout(root);main.setContentsMargins(0,0,0,0);main.setSpacing(0)
        header=QFrame();header.setObjectName("header")
        head=QHBoxLayout(header);head.setContentsMargins(24,14,24,14)
        left=QVBoxLayout()
        name=QLabel("E5CC-T   /   PROGRAMME STUDIO")
        name.setStyleSheet("font:600 20px 'Segoe UI';color:#173d59")
        left.addWidget(name)
        left.addWidget(text("Controller programming & configuration",True))
        head.addLayout(left,1)
        self.link_status=QLabel("●  Offline / disconnected")
        self.link_status.setStyleSheet("color:#627a90;font-weight:600")
        head.addWidget(self.link_status)
        mode=QLabel("ISOLATED LAB MODE" if self.lab else "READ-ONLY STARTUP")
        mode.setStyleSheet("color:#4c6981;background:#eaf1f7;"
                           "border-radius:8px;padding:9px 12px;font-weight:600")
        head.addWidget(mode)
        main.addWidget(header)
        nav=QWidget()
        nav.setStyleSheet("background:#fff;border-bottom:1px solid #dce5ee")
        n=QHBoxLayout(nav);n.setContentsMargins(20,7,20,7);n.setSpacing(5)
        self.navbuttons=[]
        for index,label in enumerate(STEPS):
            b=QPushButton(label);b.setProperty("nav",True)
            b.setCheckable(True);b.clicked.connect(lambda checked,i=index:self.show_step(i))
            b.setMinimumWidth(135)
            self.navbuttons.append(b);n.addWidget(b)
        n.addStretch(1)
        main.addWidget(nav)
        body=QWidget()
        body_lay=QHBoxLayout(body)
        body_lay.setContentsMargins(16,13,16,13);body_lay.setSpacing(12)
        self.side,self.side_lay=card(14)
        self.side.setMinimumWidth(174);self.side.setMaximumWidth(235)
        label=QLabel("CONTROLLER");label.setObjectName("subheading")
        self.side_lay.addWidget(label)
        self.device_model=text("No controller connected",False)
        self.device_model.setStyleSheet("font-weight:600;color:#1b344c")
        self.side_lay.addWidget(self.device_model)
        self.device_detail=text("Connect in Step 2, or work completely offline.",True)
        self.side_lay.addWidget(self.device_detail)
        self.device_state=QLabel("●  Not connected")
        self.device_state.setObjectName("warning")
        self.side_lay.addWidget(self.device_state)
        self.side_lay.addWidget(text("The real hardware identity is limited to the model prefix. The full suffix must be checked on the nameplate.",True))
        self.side_lay.addSpacing(12)
        self.side_lay.addWidget(button("Reconnect / Read",lambda:self.show_step(1)))
        self.side_lay.addWidget(button("Open backup…",self.open_backup))
        self.side_lay.addWidget(button("Export inventory…",self.export_inventory))
        self.side_lay.addStretch(1)
        body_lay.addWidget(self.side)
        self.pages=QStackedWidget()
        body_lay.addWidget(self.pages,1)
        self._mode_page();self._read_page();self._programme_page()
        self._settings_page();self._apply_page()
        main.addWidget(body,1)
        foot=QFrame();foot.setObjectName("footer")
        f=QHBoxLayout(foot);f.setContentsMargins(20,8,20,8)
        self.feedback=QLabel("Choose Connected or Offline to begin")
        self.feedback.setObjectName("muted")
        self.feedback.setWordWrap(True)
        f.addWidget(self.feedback,1)
        self.progress=QProgressBar()
        self.progress.setRange(0,0);self.progress.setFixedWidth(120)
        self.progress.setVisible(False);f.addWidget(self.progress)
        self.back_button=button("← Back",self.back)
        self.next_button=button("Continue →",self.next)
        self.next_button.setProperty("primary",True)
        f.addWidget(self.back_button);f.addWidget(self.next_button)
        main.addWidget(foot)

    def _mode_page(self):
        page=QWidget();lay=QVBoxLayout(page);lay.setSpacing(14)
        lay.addWidget(heading("How would you like to work?",
                 "Choose once. Everything stays in this desktop application, with no website or JSON hand-off."))
        choices=QHBoxLayout()
        for title,subtitle,callback in [
            ("Connected to Omron","Connect with the E58-CIFQ2 cable, read current "
             "settings, back up all eight programme memories and review changes.",lambda:self.choose_mode("connected")),
            ("Offline / manual","Design heating profiles and draft controller settings "
             "without the USB cable, then generate a complete front-panel entry guide.",
             lambda:self.choose_mode("offline"))]:
            frame,fl=card(22)
            heading_label=QLabel(title);heading_label.setObjectName("heading");fl.addWidget(heading_label)
            fl.addWidget(text(subtitle,True))
            fl.addSpacing(10)
            fl.addWidget(button("Select "+title,callback,True))
            fl.addStretch()
            choices.addWidget(frame)
        lay.addLayout(choices,1)
        lay.addWidget(text("The app never starts the controller or energises the heater. "
                           "A programme graph is a commanded setpoint, not a measured temperature.",True))
        self.pages.addWidget(page)

    def _read_page(self):
        page=QWidget();lay=QVBoxLayout(page);lay.setSpacing(9)
        lay.addWidget(heading("Read & back up your controller",
            "Read-only hardware inspection, verified file backups and understandable stored programmes."))
        self.connection_controls=QWidget()
        row=QHBoxLayout(self.connection_controls)
        row.setContentsMargins(0,0,0,0)
        self.port_combo=StudioCombo();self.port_combo.setMinimumWidth(120)
        row.addWidget(text("COM port"));row.addWidget(self.port_combo)
        row.addWidget(button("Refresh ports",self.refresh_ports))
        self.folder=QLineEdit(str(Path.home()/"Documents"/"Omron E5CC-T Backups"))
        self.folder.setMinimumWidth(180);row.addWidget(self.folder,1)
        row.addWidget(button("Folder…",self.choose_folder))
        self.btn_read=button("CONNECT + READ EVERYTHING",self.connect_read,True)
        row.addWidget(self.btn_read)
        self.btn_disconnect=button("Disconnect",self.disconnect)
        row.addWidget(self.btn_disconnect)
        lay.addWidget(self.connection_controls)
        self.offline_return=button("← Return to offline workspace",self._offline_home)
        self.offline_return.hide()
        lay.addWidget(self.offline_return)
        self.read_message=text("Connect and inspect. The first extended inventory is not yet qualified on hardware.",True)
        lay.addWidget(self.read_message)
        tabs=QTabWidget()
        one=QWidget();ol=QVBoxLayout(one)
        self.memory_table=QTableWidget(8,3)
        self.memory_table.setHorizontalHeaderLabels(["Programme","Segments","Stored meaning"])
        self._table_defaults(self.memory_table)
        self.memory_table.horizontalHeader().setSectionResizeMode(2,QHeaderView.ResizeMode.Stretch)
        self.memory_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.memory_table.itemSelectionChanged.connect(self._memory_selected)
        ol.addWidget(self.memory_table,1)
        low=QHBoxLayout()
        self.explorer_chart=Profile();self.explorer_chart.setMinimumHeight(185)
        low.addWidget(self.explorer_chart,2)
        self.explorer_info=QTextEdit();self.explorer_info.setReadOnly(True)
        self.explorer_info.setMinimumWidth(240);low.addWidget(self.explorer_info,1)
        ol.addLayout(low,2)
        tools=QHBoxLayout()
        tools.addWidget(button("Edit selected stored programme in Step 3",self.copy_stored))
        tools.addWidget(button("Verify save receipt after USB power cycle…",self.verify_receipt))
        tools.addStretch()
        ol.addLayout(tools)
        tabs.addTab(one,"Stored programmes")
        self.initial_text=QTextEdit();self.initial_text.setReadOnly(True)
        tabs.addTab(self.initial_text,"Initial configuration")
        self.inventory_text=QTextEdit();self.inventory_text.setReadOnly(True)
        tabs.addTab(self.inventory_text,"Extended inventory")
        self.audit_text=QTextEdit();self.audit_text.setReadOnly(True)
        tabs.addTab(self.audit_text,"Activity log")
        lay.addWidget(tabs,1)
        filetools=QHBoxLayout()
        for caption,callback in [
            ("Open saved initial setup…",self.open_setup),
            ("Open saved parameter inventory…",self.open_inventory),
            ("Export selected programme explanation",self.export_stored_profile),
            ("Export activity log",self.export_log)]:
            filetools.addWidget(button(caption,callback))
        filetools.addStretch()
        lay.addLayout(filetools)
        self.read_tabs=tabs
        # Offline is a real preparation stage, not a silent jump to Step 3.
        # Inspecting a saved backup can display the above read-only explorer
        # without ever opening a serial port.
        offline=QWidget()
        o=QVBoxLayout(offline);o.setSpacing(15)
        o.addWidget(heading("Your offline workspace",
            "Plan and prepare programmes without the USB cable, then enter them using the complete keypad guide."))
        notice,notice_l=card(14)
        notice_l.addWidget(text("OFFLINE · NO DEVICE CONNECTED"))
        notice_l.addWidget(text("No live controller values are assumed. You can build a profile, "
            "view saved memories, draft documented settings, and print the exact Omron entry worksheet. "
            "Nothing here changes the physical controller.",True))
        o.addWidget(notice)
        cards=QHBoxLayout()
        choices=[
            ("Create a heating programme",
             "Start from a blank segment. Add ramps, soaks and steps; watch the plot update.",
             self._new_offline_programme,"Start programme editor →"),
            ("Resume an existing project",
             "Open an earlier eight-programme Studio project and continue where you left off.",
             self._open_offline_project,"Open a project…"),
            ("Inspect saved controller data",
             "Open a backup from an earlier USB session. Compare stored programmes without connecting.",
             self.open_backup,"Open a saved backup…"),
        ]
        for title,description,callback,caption in choices:
            item,body=card(18)
            title_label=QLabel(title);title_label.setObjectName("subheading")
            body.addWidget(title_label)
            body.addWidget(text(description,True))
            body.addStretch()
            body.addWidget(button(caption,callback,True))
            cards.addWidget(item,1)
        o.addLayout(cards,1)
        more=QHBoxLayout()
        more.addWidget(button("Browse / draft initial settings",lambda:self.show_step(3)))
        more.addWidget(button("Open a saved parameter inventory",self.open_inventory))
        more.addWidget(button("Show manual keypad entry worksheet",lambda:self.show_step(4)))
        more.addStretch()
        o.addLayout(more)
        o.addWidget(text("Offline workflow: prepare → programme → settings → guided keypad entry. "
                         "If the controller is connected tomorrow, switch back to Connected mode in Step 1.",True))
        self.read_host=QStackedWidget()
        self.read_host.addWidget(page)
        self.read_host.addWidget(offline)
        self.pages.addWidget(self.read_host)

    def _offline_home(self):
        self.offline_inspect_saved=False
        self.show_step(1)

    def _new_offline_programme(self):
        if self._editing_locked():return
        self.programmes[self.slot]=blank_programme()
        self._render_programme()
        self.preview_stamp=None
        self.show_step(2)

    def _open_offline_project(self):
        if self.open_project():
            self.show_step(2)

    def _programme_page(self):
        page=QWidget()
        outer=QVBoxLayout(page)
        outer.setContentsMargins(0,0,0,0)
        scroller=QScrollArea()
        scroller.setWidgetResizable(True)
        scroller.setFrameShape(QFrame.Shape.NoFrame)
        body=QWidget()
        v=QVBoxLayout(body)
        v.setContentsMargins(2,2,2,2)
        v.setSpacing(9)
        scroller.setWidget(body)
        outer.addWidget(scroller)
        top=QHBoxLayout()
        top.addWidget(heading("Programme editor",
            "Each segment shows only its applicable settings. The setpoint curve updates as you edit."),1)
        top.addWidget(text("Memory"))
        self.slot_combo=StudioCombo()
        self.slot_combo.addItems([f"Programme {i}" for i in range(8)])
        self.slot_combo.currentIndexChanged.connect(self._slot_changed)
        top.addWidget(self.slot_combo)
        v.addLayout(top)

        meta=QHBoxLayout()
        meta.setSpacing(12)
        self.programme_name=QLineEdit()
        self.programme_name.setMinimumHeight(38)
        meta.addWidget(form_field("Description",self.programme_name),1)
        self.start_pv=QDoubleSpinBox()
        self.start_pv.setRange(-20,500);self.start_pv.setDecimals(1)
        self.start_pv.setSingleStep(0.1)
        self.start_pv.setSuffix(" °C")
        self.start_pv_editor=Stepper("Starting PV (assumed)",self.start_pv)
        self.start_pv_editor.setMinimumWidth(175)
        meta.addWidget(self.start_pv_editor)
        self.finish_mode=StudioCombo()
        self.finish_mode.addItem("RESET (stop)", "rst")
        self.finish_mode.addItem("CONTINUE", "cont")
        self.finish_mode.setMinimumWidth(150)
        meta.addWidget(form_field("At programme end",self.finish_mode))
        v.addLayout(meta)

        split=QSplitter(Qt.Orientation.Vertical)
        split.setChildrenCollapsible(False)
        split.setHandleWidth(7)
        curve_card,curve_layout=card(12)
        curve_layout.addWidget(text("COMMANDED TEMPERATURE PROFILE   ·   PV is not measured"))
        self.chart=Profile()
        self.chart.setMinimumHeight(150)
        curve_layout.addWidget(self.chart,1)
        curve_card.setMinimumHeight(206)
        split.addWidget(curve_card)

        table_card,tlay=card(12)
        actionbar=QHBoxLayout()
        self.segment_heading=QLabel("Segments")
        self.segment_heading.setObjectName("subheading")
        actionbar.addWidget(self.segment_heading)
        actionbar.addStretch()
        actionbar.addWidget(text("ADD SEGMENT:",True))
        for title,kind in [("+ Ramp","ramp"),("+ Soak","soak"),("+ Step","step")]:
            actionbar.addWidget(button(title,lambda checked=False,k=kind:self.add_segment(k)))
        tlay.addLayout(actionbar)
        tlay.addWidget(text("Ramp = target + rate   ·   Soak = hold time only   ·   "
                           "Step = immediate setpoint jump; progression requires the controller's GLOBAL Wait Band.",True))
        wait_row=QHBoxLayout()
        self.wait_hint=QLabel("")
        self.wait_hint.setWordWrap(True)
        wait_row.addWidget(self.wait_hint,1)
        self.wait_configure=button("View / set Wait Band (wt-b)",self.goto_wait_setting)
        wait_row.addWidget(self.wait_configure)
        tlay.addLayout(wait_row)

        # Each row is a compact self-contained, type-aware editor. The
        # table itself is just a vertical, scrollable host; there are no
        # irrelevant Target/Rate/Hold columns.
        self.segment_table=QTableWidget(0,1)
        self.segment_table.setObjectName("segmentRows")
        self.segment_table.horizontalHeader().hide()
        self.segment_table.verticalHeader().hide()
        self.segment_table.horizontalHeader().setSectionResizeMode(0,QHeaderView.ResizeMode.Stretch)
        self.segment_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.segment_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.segment_table.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.segment_table.setShowGrid(False)
        self.segment_table.setMinimumHeight(245)
        tlay.addWidget(self.segment_table,1)

        foot=QHBoxLayout()
        self.programme_info=text("Set the target and segment rate or hold duration.",True)
        foot.addWidget(self.programme_info,1)
        for caption,callback in [
            ("Load 120 → 50 °C example",self.load_example),
            ("Copy stored programme",self.copy_stored),
            ("Save project",self.save_project),
            ("Open project",self.open_project)]:
            foot.addWidget(button(caption,callback))
        tlay.addLayout(foot)
        table_card.setMinimumHeight(325)
        split.addWidget(table_card)
        split.setStretchFactor(0,2)
        split.setStretchFactor(1,5)
        split.setSizes([220,440])
        v.addWidget(split,1)
        self.pages.addWidget(page)

        self.programme_name.editingFinished.connect(self.update_programme)
        self.start_pv.valueChanged.connect(self.update_programme)
        self.finish_mode.currentIndexChanged.connect(self.update_programme)
        self._render_programme()

    def _settings_page(self):
        page=QWidget();v=QVBoxLayout(page);v.setSpacing(8)
        v.addWidget(heading("Initial settings",
           "Search all documented groups; current values and proposed local changes are clearly separated."))
        controls=QHBoxLayout()
        self.group=StudioCombo()
        self.group.addItems(["All groups"]+group_names())
        controls.addWidget(self.group,1)
        self.search=QLineEdit();self.search.setPlaceholderText("Search by purpose, parameter or register…")
        controls.addWidget(self.search,2)
        self.draft_count=text("0 proposed changes",True)
        controls.addWidget(self.draft_count)
        controls.addWidget(button("Clear proposed changes",self.clear_draft))
        v.addLayout(controls)
        split=QSplitter(Qt.Orientation.Horizontal)
        list_card,lc=card(10)
        self.setting_table=QTableWidget(0,4)
        self.setting_table.setHorizontalHeaderLabels(
            ["Parameter","Read from controller","Proposed value","Group"])
        self._table_defaults(self.setting_table)
        self.setting_table.horizontalHeader().setSectionResizeMode(0,QHeaderView.ResizeMode.Stretch)
        self.setting_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.setting_table.itemSelectionChanged.connect(self._setting_selected)
        lc.addWidget(self.setting_table)
        split.addWidget(list_card)
        detail,dl=card(16)
        dl.addWidget(QLabel("SETTING EXPLANATION"))
        self.parameter_detail=QTextEdit()
        self.parameter_detail.setReadOnly(True)
        self.parameter_detail.setMinimumWidth(235)
        dl.addWidget(self.parameter_detail,1)
        self.parameter_editor=QLineEdit()
        self.parameter_editor.setPlaceholderText("Documented numeric value")
        dl.addWidget(self.parameter_editor)
        self.parameter_choices=StudioCombo()
        dl.addWidget(self.parameter_choices)
        dl.addWidget(button("Add to change review",self.propose_setting,True))
        dl.addWidget(text("Settings here are local proposals. USB configuration writing "
                          "is not yet enabled. Special/conditional registers must be verified on the actual controller.",True))
        split.addWidget(detail)
        split.setSizes([750,310])
        v.addWidget(split,1)
        self.pages.addWidget(page)
        self.group.currentTextChanged.connect(self.refresh_settings)
        self.search.textChanged.connect(self.refresh_settings)
        self.refresh_settings()

    def _apply_page(self):
        page=QWidget();v=QVBoxLayout(page);v.setSpacing(9)
        v.addWidget(heading("Review, upload or program manually",
            "A simpler guided keypad worksheet, with the complete instructions available whenever you need them."))
        self.apply_overview=text("")
        v.addWidget(self.apply_overview)
        self.apply_tabs=QTabWidget()

        manual=QWidget();mv=QVBoxLayout(manual);mv.setSpacing(10)
        intro=QHBoxLayout()
        intro.addWidget(text("Omron keypad entry · select a setting to see its exact "
                             "meaning and key presses.",True),1)
        intro.addWidget(text("Stage:",True))
        self.manual_phase=StudioCombo()
        self.manual_phase.setMinimumWidth(170)
        self.manual_phase.addItem("All stages")
        intro.addWidget(self.manual_phase)
        mv.addLayout(intro)

        split=QSplitter(Qt.Orientation.Horizontal)
        split.setChildrenCollapsible(False)
        split.setHandleWidth(7)
        left,left_v=card(12)
        left_v.addWidget(text("CONTROLLER DISPLAY     /     REQUIRED VALUE",True))
        self.entry_table=QTableWidget(0,2)
        self.entry_table.setHorizontalHeaderLabels(["Omron display","Value to set / check"])
        self._table_defaults(self.entry_table)
        self.entry_table.setWordWrap(True)
        self.entry_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.entry_table.horizontalHeader().setSectionResizeMode(1,QHeaderView.ResizeMode.Stretch)
        self.entry_table.setColumnWidth(0,127)
        self.entry_table.setMinimumWidth(280)
        self.entry_table.verticalHeader().setDefaultSectionSize(36)
        self.entry_table.itemSelectionChanged.connect(self._manual_selected)
        left_v.addWidget(self.entry_table,1)
        split.addWidget(left)

        right,right_v=card(18)
        right.setMinimumWidth(325)
        self.manual_position=text("Choose the first parameter",True)
        right_v.addWidget(self.manual_position)
        self.manual_code=QLabel("d.prg")
        self.manual_code.setStyleSheet("font:700 25px 'Consolas';color:#095b9c")
        right_v.addWidget(self.manual_code)
        self.manual_value=QLabel("Required value")
        self.manual_value.setStyleSheet("font:600 18px 'Segoe UI';color:#1d4966")
        self.manual_value.setWordWrap(True)
        right_v.addWidget(self.manual_value)
        self.manual_purpose=QLabel("What this parameter controls")
        self.manual_purpose.setObjectName("subheading")
        self.manual_purpose.setWordWrap(True)
        right_v.addWidget(self.manual_purpose)
        right_v.addWidget(text("HOW TO ENTER OR VERIFY",True))
        self.manual_instructions=QTextEdit()
        self.manual_instructions.setReadOnly(True)
        self.manual_instructions.setFontFamily("Segoe UI")
        self.manual_instructions.setStyleSheet(
            "QTextEdit{border:0;background:#f3f8fc;border-radius:9px;padding:13px;"
            "font-size:13px;color:#27465e}")
        right_v.addWidget(self.manual_instructions,1)
        self.manual_risk=text("Values marked VERIFY must be checked against the actual controller.",True)
        right_v.addWidget(self.manual_risk)
        navi=QHBoxLayout()
        navi.addWidget(button("← Previous setting",lambda:self._manual_move(-1)))
        navi.addWidget(button("Next setting →",lambda:self._manual_move(1),True))
        right_v.addLayout(navi)
        split.addWidget(right)
        split.setStretchFactor(0,1)
        split.setStretchFactor(1,2)
        split.setSizes([390,540])
        mv.addWidget(split,1)

        self.entry_summary=text("The complete entry worksheet follows your Step 3 programme.",True)
        mv.addWidget(self.entry_summary)
        row=QHBoxLayout()
        row.addWidget(button("Save / print complete guide",self.export_manual,True))
        row.addWidget(button("Copy all keypad steps",self.copy_manual))
        row.addWidget(button("Practise five-button keypad",self.open_keypad_practice))
        row.addWidget(button("Settings change report",self.export_review))
        row.addStretch()
        mv.addLayout(row)
        mv.addWidget(text("The worksheet only prepares keypad instructions; it cannot "
            "start RUN or modify the Omron. d.prg selects the memory to edit; prg selects "
            "the memory for later operation.",True))
        self.manual_phase.currentTextChanged.connect(self._manual_fill)
        self.apply_tabs.addTab(manual,"Offline / manual entry")

        usb=QWidget();uv=QVBoxLayout(usb);uv.setSpacing(9)
        self.apply_details=QTextEdit();self.apply_details.setReadOnly(True)
        uv.addWidget(self.apply_details,1)
        actions=QHBoxLayout()
        self.preview_button=button("1   Preview exact changes",self.preview,True)
        self.stage_button=button("2   Write to RAM + verify",self.stage)
        self.save_button=button("3   Save to controller",self.commit)
        for item in (self.preview_button,self.stage_button,self.save_button):
            actions.addWidget(item)
        actions.addStretch()
        uv.addLayout(actions)
        completion=QHBoxLayout()
        self.cmw_off_button=button("4   Finish programming · CMW OFF",self.disable_cmw)
        self.cmw_off_button.setToolTip(
            "Only available after the SAVE RAM DATA command and receipt; "
            "sends H186 Communications Writing OFF. Does not stop the heater.")
        completion.addWidget(self.cmw_off_button)
        completion.addWidget(text(
            "CMW indicates that USB/serial parameter writes are enabled; "
            "it is not the controller's RUN mode.",True),1)
        uv.addLayout(completion)
        self.usb_next_action=text("Connect and take a full backup before writing.")
        self.usb_next_action.setStyleSheet("color:#a8610f;font-weight:600")
        uv.addWidget(self.usb_next_action)
        uv.addWidget(text("Only DA programme memory is writable. Initial, PID and communications "
            "changes remain offline drafts. The heater must be isolated.",True))
        self.safety=[]
        checks=[
            "Controller normal mains supply and external heater DC are physically isolated",
            "Full E5CC-TQX3A5M-000 suffix confirmed on the physical nameplate",
            "Controller is stopped/RESET; no live heater operation",
            "Fresh backup of all eight programme memories has completed",
            "Understand RAM stage is temporary; SAVE RAM DATA is separate",
            "This is isolated commissioning, not permission to energise the heater",
        ]
        checks_card,checks_layout=card(10)
        for caption in checks:
            check=QCheckBox(caption)
            check.toggled.connect(self.refresh_actions)
            checks_layout.addWidget(check)
            self.safety.append(check)
        uv.addWidget(checks_card)
        self.apply_tabs.addTab(usb,"Connected USB transfer")
        v.addWidget(self.apply_tabs,1)
        self.pages.addWidget(page)

    @staticmethod
    def _table_defaults(table):
        table.setAlternatingRowColors(True)
        table.verticalHeader().setVisible(False)
        table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        table.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        table.horizontalHeader().setStretchLastSection(True)
        table.setShowGrid(False)

    @staticmethod
    def _cell(table,r,c,s):
        item=QTableWidgetItem(str(s))
        item.setFlags(item.flags() & ~Qt.ItemFlag.ItemIsEditable)
        table.setItem(r,c,item)

    def choose_mode(self,mode):
        if mode not in ("connected","offline"):return
        if mode=="offline" and self.client:
            self.disconnect()
            if self.client:return
        self.mode=mode
        self.offline_inspect_saved=False
        if mode=="offline":
            self.inventory=offline_inventory()
            self.inventory_current_session=False
            self.draft={}
            self.refresh_settings()
        self.show_step(1)

    def show_step(self,index):
        self._current_step=max(0,min(4,index))
        self.pages.setCurrentIndex(self._current_step)
        for i,b in enumerate(self.navbuttons):
            b.setChecked(i==self._current_step)
        self.back_button.setEnabled(self._current_step!=0)
        self.next_button.setVisible(self._current_step!=4)
        if self._current_step==1:
            self.read_host.setCurrentIndex(0 if self.mode=="connected" or self.offline_inspect_saved else 1)
            self.connection_controls.setVisible(self.mode=="connected")
            self.offline_return.setVisible(self.mode=="offline" and self.offline_inspect_saved)
        if self._current_step==4:
            self.apply_tabs.setCurrentIndex(0 if self.mode=="offline" else 1)
            self.refresh_review()
        if self._current_step==3:self.refresh_settings()
        self._controls()

    def next(self):
        if self._current_step<4:self.show_step(self._current_step+1)

    def back(self):
        self.show_step(self._current_step-1)

    def message(self,title,body,warning=False):
        (QMessageBox.warning if warning else QMessageBox.information)(self,title,body)

    def choose_folder(self):
        folder=QFileDialog.getExistingDirectory(self,"Choose backup folder",self.folder.text())
        if folder:self.folder.setText(folder)

    def refresh_ports(self):
        current=self.port_combo.currentText() if hasattr(self,"port_combo") else ""
        self.port_combo.clear()
        found=serial_ports()
        self.port_combo.addItems(found)
        if current in found:self.port_combo.setCurrentText(current)
        if not found:self.read_message.setText("No USB serial port detected. Offline mode still works.")

    def _work(self,title,action,success,is_write=False,quiet=False):
        if self.busy:return
        self.busy=True
        if not quiet:
            self.progress.show()
            self.feedback.setText("Working: "+title)
        self.log_event("START "+title+(" [hardware write]" if is_write else " [read only/local]"))
        self._controls()
        worker=Task(action);self.workers.add(worker)
        worker.signals.progress.connect(lambda value:self.feedback.setText(str(value)) if not quiet else None)
        def delivered(value):
            try:
                success(value)
                if not quiet:self.log_event("DONE "+title)
            except Exception as exc:
                self._job_error(title,f"Completion callback failed: {exc}",is_write)
        worker.signals.result.connect(delivered)
        worker.signals.error.connect(
            lambda message:self._mark_link_lost("Controller heartbeat failed: "+message)
            if quiet else self._job_error(title,message,is_write))
        def cleanup():
            self.busy=False
            if not quiet:self.progress.hide()
            self.workers.discard(worker)
            self._controls()
        worker.signals.finished.connect(cleanup)
        self.pool.start(worker)

    def _job_error(self,title,error,is_write):
        if is_write:self.fail_latched=True
        self.log_event("FAILED "+title+": "+error)
        self.feedback.setText("Failed: "+title)
        self.message("Controller operation stopped",error+
            ("\n\nWRITE STATE UNCERTAIN. Keep the heater isolated and inspect the controller before retrying."
             if is_write else ""),True)

    def connect_read(self):
        if self.busy:return
        port=self.port_combo.currentText().strip()
        if not port:
            self.message("Connect USB cable","Choose the actual COM port first.",True);return
        if self.client:self.disconnect()
        folder=self.folder.text().strip()
        if not folder:
            self.message("Backup folder required","Select a location for verified backups.",True);return
        self.preview_stamp=None
        def job(progress):
            client=SerialClient(port,write_allowed=self.lab)
            try:
                ses=TransferSession(client)
                progress("Reading controller identity and nine preflight settings…")
                ses.preflight()
                progress("Backing up eight programme memories (read only)…")
                ses.backup(folder,progress=lambda done,total:
                           progress(f"Backing up programme {done}/{total}…"))
                progress("Reading initial configuration…")
                setup=read_snapshot(client,ses.info,ses.settings)
                setup_path=save_json_fresh(folder,"initial-settings",setup)
                progress("Reading extended documented inventory (read only)…")
                inventory_error=None
                try:
                    inv=read_inventory(client,ses.info,progress=lambda done,total:
                       progress(f"Extended register inventory: {done}/{total}…"))
                    inv_path=save_json_fresh(folder,"full-inventory",inv)
                except Exception as exc:
                    # A missing optional register or interrupted extended survey
                    # must not discard the successfully verified DA backup.
                    inv=offline_inventory()
                    inv_path=None
                    inventory_error=str(exc)
                return client,ses,setup,inv,setup_path,inv_path,inventory_error
            except BaseException:
                client.close()
                raise
        def completed(result):
            self.client,self.session,self.snapshot,self.inventory,setup_file,inventory_file,inventory_error=result
            self.inventory_current_session=(inventory_error is None)
            self.port=port
            self.backup=self.session.backup_data
            self.draft={}
            self.fail_latched=False
            self.link_status.setText("●  "+port+" · Connected")
            self.link_status.setStyleSheet("color:#157952;font-weight:600")
            self.device_model.setText(self.session.info["model10"]+" (prefix)")
            self.device_detail.setText("Connected on "+port+" · full suffix requires nameplate confirmation")
            self.device_state.setText("●  Connected")
            self.device_state.setObjectName("success")
            if inventory_error:
                self.read_message.setText("Programme backup and essential setup completed. "
                    "Extended inventory NOT available: "+inventory_error)
            else:
                self.read_message.setText("Read-only backup and inventory complete. "
                    f"{len(CATALOG)-len(self.inventory['errors'])} extended registers read; "
                    f"{len(self.inventory['errors'])} unavailable.")
            self.initial_text.setPlainText(setup_report(self.snapshot))
            self.inventory_text.setPlainText(
                ("Extended inventory failed: "+inventory_error+"\nOnly offline unknown-value planning is available."
                 if inventory_error else report_inventory(self.inventory)))
            self._populate_memories()
            self.refresh_settings()
            self.refresh_review()
            self.feedback.setText("Backups saved: "+str(self.session.backup_file))
            self.message("Controller read completed",
                "All eight programme memory blocks were saved and verified.\n"
                f"Initial settings saved: {setup_file.name}\n"+
                ("Extended inventory was NOT completed: "+inventory_error+"\n"
                 if inventory_error else f"Extended inventory saved: {inventory_file.name}\n")+
                "No controller writes performed.")
        self._work("Read everything",job,completed)

    def disconnect(self):
        if self.busy:
            self.message("USB busy","Wait for the serial operation to finish.",True);return
        if self.session and self.session.ram_touched and not self.session.committed:
            if QMessageBox.question(self,"Uncommitted RAM",
               "RAM has been modified without a confirmed nonvolatile save. "
               "Do not assume a rollback. Disconnect anyway?")!=QMessageBox.StandardButton.Yes:return
        if self.client:
            try:self.client.close()
            except Exception:pass
        self.client=None;self.session=None;self.port=None;self.preview_stamp=None
        self.inventory_current_session=False
        self.link_status.setText("●  Offline / disconnected")
        self.link_status.setStyleSheet("color:#627a90;font-weight:600")
        self.device_state.setText("●  Not connected")
        self.device_model.setText("Offline controller workspace")
        self.device_detail.setText("Previously saved files remain available.")
        self.feedback.setText("USB disconnected. Local programmes and files retained.")
        self._controls()
        self.refresh_review()

    def _monitor_connection(self):
        if not self.client or self.busy:return
        try:
            present={p.casefold() for p in serial_ports()}
        except Exception:return
        if self.port and self.port.casefold() not in present:
            self._lost_link("COM port disappeared from Windows")
            return
        self._heartbeat_tick+=1
        if self._heartbeat_tick<4:return
        self._heartbeat_tick=0
        def probe(progress):
            return self.client.status()
        def ok(status):
            if not status: self._lost_link("Controller returned empty status")
        # Health is a read-only transaction and skipped during any other work.
        self._work("Read-only USB health check",probe,ok,quiet=True)
    def _mark_link_lost(self,reason):
        staged=bool(self.session and self.session.ram_touched and not self.session.committed)
        previous=self.client
        self.client=None;self.session=None;self.port=None;self.preview_stamp=None
        self.fail_latched=staged
        if previous:
            try:previous.close()
            except Exception:pass
        self.link_status.setText("●  USB disconnected")
        self.link_status.setStyleSheet("color:#a8610f;font-weight:600")
        self.device_state.setText("●  Disconnected")
        self.device_model.setText("Offline controller workspace")
        self.device_detail.setText("Stored local programmes and backups are still available.")
        self.feedback.setText("USB DISCONNECTED — "+reason+" · reconnect and re-read before any write")
        if staged:
            self.message("Controller RAM state unknown",
              "USB was lost while RAM data may not have been saved. Keep the heater isolated; "
              "reconnect and inspect before considering another write.",True)
        self.refresh_review()

    def _lost_link(self,reason):
        if self.busy:return
        self._mark_link_lost(reason)

    def verify_receipt(self):
        if not self.session or self.busy:
            self.message("Reconnect first",
                "After a full USB power cycle, reconnect and read all eight memories before verifying a receipt.",
                True)
            return
        path,_=QFileDialog.getOpenFileName(self,"Open original upload receipt",
                                           str(self.session.backup_file.parent),
                                           "E5CC-T receipt (*.json)")
        if not path:return
        def job(progress):
            return self.session.verify_persistence(path)
        def done(out):
            self.feedback.setText("Saved programme receipt compared with current controller memory.")
            self.message("Post-power-cycle comparison",
                "The controller's registers matched the saved receipt. "
                "This compares the current memory with the receipt; make sure "
                "you actually unplugged USB and the controller display turned off.")
        self._work("Verify programme memory persistence (read only)",job,done)

    def save_project(self):
        self.update_programme()
        try:
            for p in self.programmes:p.validate()
        except Exception as exc:
            self.message("Project contains an invalid programme",str(exc),True);return
        path,_=QFileDialog.getSaveFileName(self,"Save local studio project",
                    "E5CC-T-offline-project.json","Studio projects (*.json)")
        if not path:return
        document={"schema":"e5cct-modern-studio-project-1",
                  "programmes":[p.as_json() for p in self.programmes],
                  "selected_slot":self.slot,
                  "configuration_changes":[{"address":k,"value":v} for k,v in sorted(self.draft.items())],
                  "note":"Local offline workspace; not a controller register backup."}
        try:
            # Qt's native Save dialog asks before replacing existing files.
            # Write atomically so a failed export cannot truncate an old project.
            from PySide6.QtCore import QSaveFile, QIODevice
            file=QSaveFile(str(path))
            if not file.open(QIODevice.OpenModeFlag.WriteOnly):
                raise OSError(file.errorString())
            data=json.dumps(document,indent=2,ensure_ascii=False).encode("utf-8")
            if file.write(data)!=len(data) or not file.commit():
                raise OSError(file.errorString())
        except Exception as exc:
            self.message("Cannot save local project",str(exc),True);return
        self.feedback.setText("Local offline project saved to "+str(path))

    def open_project(self):
        if self._editing_locked():return
        path,_=QFileDialog.getOpenFileName(self,"Open local studio project",
                    "","Studio projects (*.json)")
        if not path:return
        try:
            obj=json.loads(Path(path).read_text(encoding="utf-8"))
            if obj.get("schema")!="e5cct-modern-studio-project-1" or len(obj["programmes"])!=8:
                raise ValueError("Invalid or incomplete eight-programme project")
            programs=[Programme.from_json(p) for p in obj["programmes"]]
            draft={}
            for item in obj.get("configuration_changes",[]):
                key,value=item["address"],item["value"]
                if key not in CATALOG or type(value) is not int or not 0<=value<=0xffffffff:
                    raise ValueError("Unknown or invalid configuration change")
                draft[key]=value
            slot=obj.get("selected_slot",0)
            if type(slot) is not int or slot not in range(8):raise ValueError("Invalid memory slot")
        except Exception as exc:
            self.message("Cannot open local project",str(exc),True);return
        self.programmes=programs
        self.draft=draft
        self.slot=slot
        self.slot_combo.blockSignals(True)
        self.slot_combo.setCurrentIndex(slot)
        self.slot_combo.blockSignals(False)
        self._render_programme()
        self.preview_stamp=None
        self.refresh_settings()
        self.feedback.setText("Local offline project opened; no controller write performed")
        return True

    def log_event(self,detail):
        stamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        row=f"{stamp} | {detail}"
        self.audit_entries.append(row)
        if hasattr(self,"audit_text"):self.audit_text.append(row)

    def open_setup(self):
        file,_=QFileDialog.getOpenFileName(self,"Open saved controller initial settings",
                                              "","JSON (*.json)")
        if not file:return
        try:
            data=json.loads(Path(file).read_text(encoding="utf-8"))
            validate_snapshot(data)
        except Exception as exc:
            self.message("Invalid initial settings snapshot",str(exc),True);return
        self.snapshot=data
        self.initial_text.setPlainText("SAVED FILE (not live controller data)\n\n"+setup_report(data))
        self.log_event("Opened saved initial setup "+file)
        if self.mode=="offline":self.offline_inspect_saved=True
        self.show_step(1);self.read_tabs.setCurrentIndex(1)

    def open_inventory(self):
        file,_=QFileDialog.getOpenFileName(self,"Open saved H186 parameter inventory",
                                              "","JSON (*.json)")
        if not file:return
        try:
            data=json.loads(Path(file).read_text(encoding="utf-8"))
            validate_inventory(data)
        except Exception as exc:
            self.message("Invalid parameter inventory",str(exc),True);return
        self.inventory=data
        self.inventory_current_session=False
        self.draft={}
        self.inventory_text.setPlainText("SAVED FILE (not a live hardware reading)\n\n"+
                                          report_inventory(data))
        self.refresh_settings()
        self.log_event("Opened saved extended parameter inventory "+file)
        if self.mode=="offline":self.offline_inspect_saved=True
        self.show_step(1);self.read_tabs.setCurrentIndex(2)

    def export_stored_profile(self):
        if not self.backup:
            self.message("No backup loaded","Connect and read, or open a saved backup.",True);return
        slot=self.memory_table.currentRow()
        if not 0<=slot<=7:slot=0
        try: content=summary_as_plaintext(decode_slot(self.backup,slot))
        except Exception as exc:
            self.message("Cannot decode programme",str(exc),True);return
        output,_=QFileDialog.getSaveFileName(self,"Save stored programme explanation",
            f"E5CC-T-stored-programme-{slot}-read-only.txt","Text (*.txt)")
        if not output:return
        try:Path(output).write_text(content,encoding="utf-8")
        except Exception as exc:
            self.message("Export failed",str(exc),True);return
        self.log_event(f"Exported stored programme {slot} explanation: "+output)

    def export_log(self):
        output,_=QFileDialog.getSaveFileName(self,"Export controller session activity log",
            "E5CC-T-session-log.txt","Text (*.txt)")
        if not output:return
        try:Path(output).write_text("\n".join(self.audit_entries)+"\n",encoding="utf-8")
        except Exception as exc:
            self.message("Export failed",str(exc),True);return

    def open_backup(self):
        file,_=QFileDialog.getOpenFileName(self,"Open saved controller backup","","JSON (*.json)")
        if not file:return
        try:self.backup=load_backup(file)
        except Exception as exc:self.message("Invalid backup",str(exc),True);return
        self._populate_memories()
        self.feedback.setText("Read-only backup loaded; it does not constitute a connected device.")
        if self.mode=="offline":self.offline_inspect_saved=True
        self.show_step(1)

    def _populate_memories(self):
        if not self.backup:return
        self.memory_table.setRowCount(8)
        for i in range(8):
            try:
                data=decode_slot(self.backup,i)
                desc=data["segments"][0]["description"] if data["segments"] else "Unknown"
                if data["warnings"]:desc="Unverified interpretation · "+desc
                self._cell(self.memory_table,i,0,i)
                self._cell(self.memory_table,i,1,data["count"])
                self._cell(self.memory_table,i,2,desc)
            except Exception as exc:
                self._cell(self.memory_table,i,0,i)
                self._cell(self.memory_table,i,1,"—")
                self._cell(self.memory_table,i,2,"Unavailable: "+str(exc))
        self.memory_table.selectRow(0)

    def _memory_selected(self):
        if not self.backup:return
        row=self.memory_table.currentRow()
        if row<0:return
        try:
            summary=decode_slot(self.backup,row)
            self.explorer_info.setPlainText(summary_as_plaintext(summary))
            points=profile_points(summary,20)
            self.explorer_chart.show_points(points)
        except Exception as exc:
            self.explorer_info.setPlainText(str(exc));self.explorer_chart.show_points([])

    def _editing_locked(self):
        if self.busy:
            self.feedback.setText("Wait for the active USB operation before editing programmes.")
            return True
        if self.session and self.session.staged is not None and not self.session.committed:
            self.message("Finish staged upload",
                "Verified RAM data is awaiting SAVE. Save or disconnect and inspect the controller "
                "before changing this local programme or initial settings.",True)
            return True
        return False

    def copy_stored(self):
        if self._editing_locked():return
        if not self.backup:
            self.message("No stored programmes","Connect and back up in Step 2, or open a saved backup.",True);return
        selected=self.memory_table.currentRow()
        if selected<0:selected=self.slot
        try:
            summary=decode_slot(self.backup,selected)
            if summary["warnings"] or summary["repeat"]!=0 or summary["link"]!=-1:
                raise ValueError("Unsupported or uncertain programme. Refusing to omit unknown data.")
            steps=[]
            for entry in summary["segments"]:
                kind=entry["type"]
                if kind=="soak":
                    if entry["minutes"] is None:raise ValueError("Unknown soak duration")
                    steps.append(Segment("soak",minutes=str(entry["minutes"])))
                elif kind=="step":
                    if entry["sp"] is None:raise ValueError("Unknown target")
                    steps.append(Segment("step",sp=str(entry["sp"])))
                elif kind=="ramp":
                    if entry["sp"] is None or entry["rate"] is None:raise ValueError("Unknown ramp")
                    if entry["rate"]==0:steps.append(Segment("step",sp=str(entry["sp"])))
                    else:steps.append(Segment("ramp",sp=str(entry["sp"]),rate=str(entry["rate"])))
                else:raise ValueError("Unknown segment type")
            loaded=Programme("Copy of stored programme "+str(selected),"20","rst",steps)
            loaded.validate()
        except Exception as exc:
            self.message("Cannot safely edit stored programme",str(exc),True);return
        if QMessageBox.question(self,"Edit stored programme",
            f"Copy stored memory {selected} into local editor? This does NOT write the Omron.")!=QMessageBox.StandardButton.Yes:return
        self.programmes[selected]=loaded
        self.slot_combo.setCurrentIndex(selected)
        self._render_programme()
        self.preview_stamp=None
        self.show_step(2)

    def _slot_changed(self,slot):
        if slot<0:return
        self.update_programme()
        self.slot=slot
        self._render_programme()
        self.preview_stamp=None;self.refresh_review()

    def _render_programme(self):
        self._rendering=True
        p=self.programmes[self.slot]
        self.programme_name.setText(p.name)
        self.start_pv.setValue(float(p.start))
        self.finish_mode.setCurrentIndex(0 if p.finish=="rst" else 1)
        self.segment_table.setRowCount(0)
        self.segment_table.setRowCount(len(p.steps))
        for index,segment in enumerate(p.steps):
            row=SegmentRow(index,segment)
            row.changed.connect(self.update_programme)
            row.move_up.connect(lambda i=index:self._segment_action(i,"up"))
            row.move_down.connect(lambda i=index:self._segment_action(i,"down"))
            row.duplicate.connect(lambda i=index:self._segment_action(i,"duplicate"))
            row.remove.connect(lambda i=index:self._segment_action(i,"remove"))
            self.segment_table.setCellWidget(index,0,row)
            self.segment_table.setRowHeight(index,96)
        if p.steps:self.segment_table.selectRow(0)
        self.segment_heading.setText(f"Segments   {len(p.steps)} / 32")
        self._rendering=False
        self._graph_current()

    def _segment_action(self,index,action):
        self.segment_table.selectRow(index)
        if action=="up":self.move_segment(-1)
        elif action=="down":self.move_segment(1)
        elif action=="duplicate":self.duplicate_segment()
        elif action=="remove":self.remove_segment()

    def update_programme(self,*unused):
        if self._rendering or not hasattr(self,"segment_table"):return
        p=self.programmes[self.slot]
        p.name=self.programme_name.text().strip()[:100] or "Unnamed programme"
        p.start=str(self.start_pv.value())
        p.finish=self.finish_mode.currentData()
        rows=[]
        for index in range(self.segment_table.rowCount()):
            editor=self.segment_table.cellWidget(index,0)
            if editor is None:return
            rows.append(editor.as_segment())
        p.steps=rows
        self.preview_stamp=None
        self._graph_current()
        self.refresh_actions()

    def _graph_current(self):
        try:
            p=self.programmes[self.slot]
            metrics=p.validate()
            self.chart.show_points(metrics["points"])
            has_step=any(seg.type=="step" for seg in p.steps)
            self.programme_info.setText(
                f"{len(p.steps)} segments   ·   {metrics['minutes']:.1f} min programmed "
                f"(excludes Wait delays){' — total time cannot be predicted' if has_step else ''}   ·   "
                f"Final SP {metrics['final_sp']:g} °C")
            self._refresh_wait_hint()
        except Exception as exc:
            self.chart.show_points([])
            self.programme_info.setText("Needs correction: "+str(exc))


    def _refresh_wait_hint(self):
        """Represent the real Omron global Wait Band, never a per-Step toggle."""
        if not hasattr(self,"wait_hint"):return
        if not any(s.type=="step" for s in self.programmes[self.slot].steps):
            self.wait_hint.setText("Wait Band is a controller-wide setting affecting segment ends, not a per-segment option.")
            self.wait_hint.setStyleSheet("color:#627a90;")
            self.wait_configure.setVisible(False)
            return
        raw=self.inventory.get("fields",{}).get("C1:0021")
        proposal=self.draft.get("C1:0021")
        live=(self.session is not None and self.client is not None and
              self.inventory_current_session)
        if raw is None or not live:
            label="NOT VERIFIED on connected hardware"
        elif raw==0:
            label="OFF on controller — Step will NOT wait"
        else:
            label=f"ACTIVE: ±{raw/10:g} °C, as read from controller"
        if proposal is not None:
            label+=("  ·  Local draft "+("OFF" if proposal==0 else f"±{proposal/10:g} °C")
                    +" (NOT APPLIED)")
        self.wait_hint.setText(
            "STEP / WAIT   ·   "+label+
            ". Applies at every segment boundary in all 8 programmes. "
            "An event input may disable waiting; reaching the band once is not a stability test.")
        self.wait_hint.setStyleSheet("color:"+("#137952" if live and raw and not self.draft else "#98631b")+";font-weight:600")
        self.wait_configure.setVisible(True)

    def goto_wait_setting(self):
        """Jump to Adjustment Level wt-b in the searchable settings catalogue."""
        self.show_step(3)
        self.group.setCurrentText("All groups")
        self.search.setText("C1:0021")
        if "C1:0021" in getattr(self,"setting_keys",[]):
            self.setting_table.selectRow(self.setting_keys.index("C1:0021"))
            self._setting_selected()

    def add_segment(self,kind):
        if self._editing_locked():return
        self.update_programme()
        self.programmes[self.slot].steps.append(Segment(kind))
        self._render_programme()
        self.preview_stamp=None
    def remove_segment(self):
        if self._editing_locked():return
        row=self.segment_table.currentRow()
        if row<0:return
        self.update_programme()
        if len(self.programmes[self.slot].steps)<=1:
            self.message("Keep one segment","A programme requires at least one segment.",True);return
        self.programmes[self.slot].steps.pop(row)
        self._render_programme()
    def duplicate_segment(self):
        if self._editing_locked():return
        row=self.segment_table.currentRow()
        if row<0:return
        self.update_programme()
        p=self.programmes[self.slot]
        if len(p.steps)>=32:return
        p.steps.insert(row+1,copy.deepcopy(p.steps[row]))
        self._render_programme()
    def move_segment(self,delta):
        if self._editing_locked():return
        row=self.segment_table.currentRow()
        if row<0:return
        self.update_programme()
        steps=self.programmes[self.slot].steps;target=row+delta
        if target<0 or target>=len(steps):return
        steps[row],steps[target]=steps[target],steps[row]
        self._render_programme();self.segment_table.selectRow(target)
    def load_example(self):
        if self._editing_locked():return
        if QMessageBox.question(self,"Use example",
            f"Replace local Programme {self.slot} with the four-segment 120 → 50 °C example?")!=QMessageBox.StandardButton.Yes:return
        self.programmes[self.slot]=copy.deepcopy(EXAMPLE)
        self._render_programme();self.preview_stamp=None

    def refresh_settings(self,*unused):
        if not hasattr(self,"setting_table"):return
        category=self.group.currentText()
        query=self.search.text().casefold()
        selected=self._selected_setting_code()
        self._rendering=True
        rows=[]
        for code,p in CATALOG.items():
            if category!="All groups" and category!=p.group:continue
            if query and query not in (code+" "+p.name+" "+p.group+" "+p.meaning).casefold():continue
            rows.append((code,p))
        self.setting_table.setRowCount(len(rows))
        self.setting_keys=[]
        for index,(code,p) in enumerate(rows):
            self.setting_keys.append(code)
            raw=self.inventory["fields"].get(code)
            current=human_value(code,raw,self.inventory["fields"].get("C3:0000"))
            proposed=(human_value(code,self.draft[code],self.inventory["fields"].get("C3:0000"))
                      if code in self.draft else "—")
            for col,txt in enumerate((p.name+" · "+code,current,proposed,p.group)):
                self._cell(self.setting_table,index,col,txt)
        self._rendering=False
        self.draft_count.setText(f"{len(self.draft)} proposed changes · {len(rows)} visible")
        if hasattr(self,"wait_hint"):self._refresh_wait_hint()
        if selected in self.setting_keys:self.setting_table.selectRow(self.setting_keys.index(selected))
        elif rows:self.setting_table.selectRow(0)
        else:self.parameter_detail.clear()
        self.refresh_actions()

    def _selected_setting_code(self):
        if not hasattr(self,"setting_keys"):return None
        row=self.setting_table.currentRow()
        return self.setting_keys[row] if 0<=row<len(self.setting_keys) else None

    def _setting_selected(self):
        if self._rendering:return
        code=self._selected_setting_code()
        if not code:return
        p=CATALOG[code]
        raw=self.inventory["fields"].get(code)
        display=human_value(code,raw,self.inventory["fields"].get("C3:0000"))
        self.parameter_detail.setPlainText(
            f"{p.name}\n{code} · H186 {p.manual_page}\n\n"
            f"{p.meaning}\n\nCurrent: {display}\n"
            f"Raw: {raw:08X}\n" if raw is not None else
            f"{p.name}\n{code}\n\n{p.meaning}\n\nCurrent: UNKNOWN / unavailable")
        self.parameter_detail.append("\nAccess: "+p.access+
                                     ("\nContext: "+p.context if p.context else ""))
        draft=self.draft.get(code,raw)
        is_known=raw is not None or self.inventory.get("mode")=="offline"
        can_edit=is_known and not code.startswith(("C0:","C4:")) and code!="C1:0029"
        self.parameter_editor.clear()
        self.parameter_choices.clear()
        if p.options:
            self.parameter_editor.hide();self.parameter_choices.show()
            self.parameter_choices.addItem("Choose a documented value",None)
            for key,label in sorted(p.options.items()):
                self.parameter_choices.addItem(f"{key} — {label}",key)
            if draft is not None:
                signed=draft-(1<<32) if draft>=(1<<31) else draft
                idx=self.parameter_choices.findData(signed)
                if idx>=0:self.parameter_choices.setCurrentIndex(idx)
            self.parameter_choices.setEnabled(can_edit)
        else:
            self.parameter_editor.show();self.parameter_choices.hide()
            if draft is not None:
                signed=draft-(1<<32) if draft>=(1<<31) else draft
                scale=(10 if self.inventory["fields"].get("C3:0000")==6 and
                         code in ("C3:0005","C3:0006","C1:0012") else p.scale)
                self.parameter_editor.setText(f"{signed/scale:g}")
            self.parameter_editor.setEnabled(can_edit)

    def propose_setting(self):
        if self._editing_locked():return
        code=self._selected_setting_code()
        if not code:return
        p=CATALOG[code]
        if p.options:
            val=self.parameter_choices.currentData()
            if val is None:
                self.message("Choose a value","Select a documented setting.",True);return
            value=str(val)
        else:value=self.parameter_editor.text()
        try:self.draft=add_proposal(self.inventory,self.draft,code,value)
        except Exception as exc:self.message("Value not valid",str(exc),True);return
        self.preview_stamp=None
        self.refresh_settings()
        self.feedback.setText(f"{len(self.draft)} configuration changes in LOCAL DRAFT. No controller settings written.")

    def clear_draft(self):
        if self._editing_locked():return
        if self.draft and QMessageBox.question(self,"Clear proposals",
             "Discard all proposed configuration changes?")!=QMessageBox.StandardButton.Yes:return
        self.draft={}
        self.refresh_settings();self.refresh_review()

    def _programme_fingerprint(self):
        p=self.programmes[self.slot]
        return (self.slot,hashlib.sha256(json.dumps(p.as_json(),sort_keys=True).encode()).hexdigest())

    def refresh_review(self):
        if not hasattr(self,"apply_details"):return
        self.update_programme()
        p=self.programmes[self.slot]
        try:
            m=p.validate()
            self.apply_overview.setText(
                f"Programme {self.slot}  ·  {len(p.steps)} segments  ·  {m['minutes']:.1f} minutes "
                f"nominal  ·  Final SP {m['final_sp']:g} °C  ·  {len(self.draft)} proposed configuration changes")
        except Exception as exc:self.apply_overview.setText("Invalid programme: "+str(exc))
        lines=[]
        for i,s in enumerate(p.steps,1):
            if s.type=="ramp":desc=f"Ramp to {s.sp} °C at {s.rate} °C/min"
            elif s.type=="soak":desc=f"Soak for {s.minutes} minutes"
            else:desc=f"Instant setpoint change to {s.sp} °C"
            lines.append(f"{i}. {desc}")
        if self.draft:
            lines.append("\nCONFIGURATION CHANGE LIST (NOT WRITTEN TO CONTROLLER)")
            for code,value in sorted(self.draft.items()):
                old=self.inventory["fields"].get(code)
                lines.append(f"{CATALOG[code].name}: {human_value(code,old)}"
                             f"  →  {human_value(code,value)}   [{code}]")
            lines.append("USB configuration writes are not enabled; programme staging is locked.")
        elif not self.session:
            lines.append("\nNo live connected controller; offline manual export is available.")
        elif self.session.staged and not self.session.committed:
            lines.append("\nRAM staging was read back and verified; nonvolatile save is still pending.")
        elif self.session.committed:
            lines.append("\nSave command acknowledged. A separate USB power-cycle persistence test is needed.")
        else:
            lines.append("\nProgramme writing requires a fresh verified backup and exact preview.")
        self.apply_details.setPlainText("\n".join(lines))
        self.refresh_manual()
        self.refresh_actions()

    def refresh_actions(self):
        if not hasattr(self,"stage_button"):return
        session=self.session
        connected=bool(session and self.client and self.mode=="connected")
        can_preview=(connected and session.backup_data is not None and not self.busy
                     and not self.draft and session.staged is None)
        can_stage=(can_preview and self.lab and not self.fail_latched and not session.mismatches
            and session.staged is None and self.preview_stamp==self._programme_fingerprint()
            and bool(self.preview_changes) and all(x.isChecked() for x in self.safety))
        can_save=(connected and self.lab and not self.busy and not self.draft and
                  not self.fail_latched and session.staged is not None and not session.committed)
        self.preview_button.setEnabled(can_preview)
        self.stage_button.setEnabled(bool(can_stage))
        self.save_button.setEnabled(bool(can_save))
        can_cmw_off=(connected and self.lab and not self.busy and not self.fail_latched
                     and session.committed and session.receipt_file is not None
                     and not session.communications_write_disabled)
        self.cmw_off_button.setEnabled(bool(can_cmw_off))
        staged=bool(session and session.staged is not None and not session.committed)
        editing_locked=staged or self.busy
        self.slot_combo.setEnabled(not editing_locked)
        self.segment_table.setEnabled(not editing_locked)
        self.programme_name.setEnabled(not editing_locked)
        self.start_pv.setEnabled(not editing_locked)
        self.finish_mode.setEnabled(not editing_locked)
        self.btn_read.setEnabled(not self.busy and self.mode=="connected")
        self.btn_disconnect.setEnabled(not self.busy and bool(self.client))
        self.next_button.setEnabled(not self.busy)
        reasons=[]
        if self.mode!="connected":
            reasons.append("Offline mode: use the complete manual keypad table.")
        elif not connected:
            reasons.append("Connect to the Omron and read all eight memories in Step 2.")
        elif session.backup_data is None:
            reasons.append("Take a fresh verified programme backup.")
        if connected:
            if not self.lab:reasons.append("Hardware writes disabled: use the isolated-lab launcher.")
            if session.mismatches:reasons.append("Preflight values differ from the tested bench configuration.")
            if self.draft:reasons.append(f"{len(self.draft)} initial/PID setting proposals are not writable via USB.")
            if self.programmes[self.slot].finish!="rst":
                reasons.append("Programme end CONTINUE requires manual setup; DA upload only supports RESET.")
            if self.fail_latched:reasons.append("A write failed: stop and inspect; do not retry blindly.")
            if self.busy:reasons.append("Communication in progress.")
            if session.staged is not None and not session.committed:
                reasons.append("RAM verified: review and use SAVE TO CONTROLLER.")
            elif session.committed:
                if session.communications_write_disabled:
                    reasons.append("CMW OFF acknowledged: confirm lamp goes out, then power-cycle and verify receipt.")
                else:
                    reasons.append("Save acknowledged: finish programming (CMW OFF), then power-cycle and verify receipt.")
            elif not self.preview_stamp:
                reasons.append("Preview the exact differences before any RAM write.")
            elif not all(c.isChecked() for c in self.safety):
                reasons.append("Complete all six safety confirmations.")
            elif can_stage:
                reasons.append("Ready for guarded RAM staging (heater power must remain isolated).")
        self.usb_next_action.setText("NEXT ACTION  ·  "+"  ·  ".join(reasons))
        self.usb_next_action.setStyleSheet("color:"+("#157952" if can_stage else "#a8610f")+";font-weight:600")

    def _controls(self):
        if hasattr(self,"stage_button"):self.refresh_actions()

    def preview(self):
        if not self.session or self.busy or self.draft:return
        try:
            self.update_programme()
            selected=copy.deepcopy(self.programmes[self.slot])
            changes=self.session.build_plan(self.slot,selected)
        except Exception as exc:self.message("Cannot prepare upload",str(exc),True);return
        self.preview_changes=changes
        self.log_event(f"Previewed Programme {self.slot}: {len(changes)} differences, no writes")
        self.preview_stamp=self._programme_fingerprint() if changes else None
        if changes:
            details="\n".join(f"DA:{addr:04X}  {old:08X}  →  {new:08X}"
                    for addr,old,new in changes)
            self.message("Read-only write preview",
                 f"{len(changes)} register differences for Programme {self.slot}:\n\n{details}\n\n"
                 "NO controller data has been written.")
        else:self.message("Programme already matches",
                          "There are no DA register changes to transfer.")
        self.refresh_actions()

    def stage(self):
        if self.busy or not self.session:return
        if not (self.lab and self.preview_stamp==self._programme_fingerprint()
                and not self.draft and all(x.isChecked() for x in self.safety)):
            self.message("Cannot write","Complete all safety checks and preview again.",True);return
        if QMessageBox.warning(self,"First RAM write confirmation",
           "This will WRITE the reviewed programme registers into controller RAM.\n"
           "Both the normal controller mains and external heater DC supplies must remain isolated.\n"
           "A partial communication failure may leave RAM changed. Continue?",
           QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No,
           QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
        slot=self.slot;p=copy.deepcopy(self.programmes[slot])
        self.preview_stamp=None
        def action(progress):
            return self.session.stage(slot,p)
        def done(result):
            self.feedback.setText("RAM verified for Programme "+str(slot)+"; nonvolatile memory NOT YET SAVED.")
            self.refresh_review()
            self.message("RAM verified","Controller RAM changes were written and read back. "
                         "They are not yet saved to nonvolatile memory.")
        self._work("Stage and verify programme RAM",action,done,True)

    def commit(self):
        if not self.session or not self.session.staged or self.busy or self.draft:return
        if (self.session.staged["slot"]!=self.slot or
                self.session.staged["programme"]!=self.programmes[self.slot].as_json()):
            self.message("Local programme differs from verified RAM",
                "The local editor no longer matches the RAM-staged programme. Do not save blindly. "
                "Keep the heater isolated and inspect the session.",True)
            return
        if QMessageBox.warning(self,"Confirm nonvolatile save",
           "Omron SAVE RAM DATA persists all pending RAM changes, not necessarily only "
           "this programme. Confirm there are no unrelated unsaved settings and that "
           "the external heater supplies are isolated. Save now?",
           QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No,
           QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
        def job(progress):return self.session.commit()
        def done(path):
            self.feedback.setText("Save acknowledged. Receipt: "+str(path))
            self.refresh_review()
            self.message("Programme saved; power-cycle still required",
                "Nonvolatile SAVE was acknowledged and registers read back.\n"
                "Unplug USB until the controller turns off, reconnect, back up again "
                "and verify the saved receipt before trusting persistence.\n"+str(path))
        self._work("Save verified RAM data",job,done,True)

    def disable_cmw(self):
        """Explicit and isolated post-SAVE action, never an automatic disconnect."""
        ses=self.session
        if (not ses or not self.client or self.busy or not self.lab or
                self.fail_latched or not ses.committed or not ses.receipt_file or
                ses.communications_write_disabled):
            self.message("Cannot disable CMW here",
                "Finish and verify the nonvolatile SAVE before ending communications write access. "
                "If this is a previous USB session, use the front-panel cmwt setting instead.",True)
            return
        if QMessageBox.warning(self,"Finish USB programming — CMW OFF",
            "CMW means Communications Writing Enabled. This sends Omron 3005 00 00 "
            "to disable parameter writing. It DOES NOT issue RUN/RESET.\n\n"
            "Some write-mode transitions can persist pending RAM changes. "
            "This function is available ONLY because SAVE RAM DATA has already "
            "been acknowledged and the receipt was saved.\n\n"
            "Confirm the heater supply remains physically isolated and no other "
            "unsaved controller changes are pending. Then visually check that the "
            "CMW indicator extinguishes. Continue?",
            QMessageBox.StandardButton.Yes|QMessageBox.StandardButton.No,
            QMessageBox.StandardButton.No)!=QMessageBox.StandardButton.Yes:return
        def job(progress):return ses.disable_communications_writing()
        def completed(result):
            self.feedback.setText("CMW OFF command acknowledged. Visually check the CMW indicator.")
            self.refresh_review()
            self.message("CMW OFF command acknowledged",
                "Omron accepted Communications Writing OFF. Confirm the physical "
                "CMW indicator is no longer illuminated. The controller remains in "
                "RESET if previously stopped; this command did not start it.\n"
                "Power-cycle USB later and verify persistence against the saved receipt.")
        self._work("Disable communications writing after save",job,completed,True)

    def refresh_manual(self):
        """Same complete parameter plan drives the guided UI and printed guide."""
        if not hasattr(self,"entry_table"):return
        try:
            plan=make_entry_plan(self.programmes[self.slot],self.slot,
                                 self.inventory["fields"],self.draft)
        except Exception as exc:
            self._manual_plan=None
            self._manual_all_rows=[]
            self.entry_table.setRowCount(0)
            self.entry_summary.setText("Cannot generate instructions: "+str(exc))
            self.manual_instructions.setPlainText(
                "Correct the programme/settings in Steps 3–4 first. "
                "No potentially misleading instructions have been generated.")
            return
        self._manual_plan=plan
        rows=list(plan["entry_rows"])
        for proposal in plan["setup_proposals"]:
            rows.append(dict(
                section="PROPOSED INITIAL / ADVANCED SETTINGS",
                code=proposal["code"],
                value=proposal["proposed"],
                purpose=proposal["name"]+" · current: "+proposal["current"],
                instruction=proposal["entry"],kind="check"))
        self._manual_all_rows=rows
        sections=list(dict.fromkeys(r["section"] for r in rows))
        previously=self.manual_phase.currentText()
        self.manual_phase.blockSignals(True)
        self.manual_phase.clear()
        self.manual_phase.addItems(["All stages"]+sections)
        self.manual_phase.setCurrentText(previously if previously in sections else "All stages")
        self.manual_phase.blockSignals(False)
        self._manual_fill()
        self.entry_summary.setText(
            f"Programme {self.slot}  ·  "
            f"{sum(r['code']=='styp' for r in rows)} segments  ·  "
            f"{plan['nominal_minutes']:.1f} minutes nominal  ·  "
            f"{len(rows)} documented parameters/actions  ·  "
            f"{len(plan['setup_proposals'])} optional setting changes (review only)."
        )

    def _manual_fill(self,*unused):
        if not hasattr(self,"_manual_all_rows"):return
        section=self.manual_phase.currentText()
        rows=[r for r in self._manual_all_rows
              if section=="All stages" or section==r["section"]]
        self._manual_rows=rows
        self._manual_rendering=True
        self.entry_table.setRowCount(len(rows))
        previous=None
        for i,item in enumerate(rows):
            self._cell(self.entry_table,i,0,item["code"])
            self._cell(self.entry_table,i,1,item["value"])
            if item["section"]!=previous:
                for j in range(2):
                    self.entry_table.item(i,j).setBackground(QColor("#e5f1fb"))
            if item["kind"]=="check":
                self.entry_table.item(i,1).setForeground(QColor("#98631b"))
            previous=item["section"]
            self.entry_table.setRowHeight(i,39)
        self._manual_rendering=False
        if rows:
            self.entry_table.selectRow(0)
            self._manual_selected()
        else:
            self.manual_position.setText("No parameters in this stage")
            self.manual_code.setText("—")
            self.manual_value.setText("")
            self.manual_purpose.setText("")
            self.manual_instructions.clear()

    def _manual_selected(self):
        if getattr(self,"_manual_rendering",False):return
        row=self.entry_table.currentRow()
        rows=getattr(self,"_manual_rows",[])
        if not 0<=row<len(rows):return
        item=rows[row]
        self.manual_position.setText(
            f"{item['section']}   ·   {row+1} of {len(rows)}")
        self.manual_code.setText(item["code"])
        self.manual_value.setText(item["value"])
        self.manual_purpose.setText(item["purpose"])
        self.manual_instructions.setPlainText(item["instruction"])
        self.manual_risk.setText(
            "CHECK the actual controller. A protected or unavailable menu must "
            "not be bypassed." if item["kind"]=="check" else
            "Programme editing instructions only. Do not press RUN while setting up."
        )

    def _manual_move(self,direction):
        row=self.entry_table.currentRow()
        n=self.entry_table.rowCount()
        if not n:return
        row=max(0,min(n-1,row+direction))
        self.entry_table.selectRow(row)
        self.entry_table.scrollToItem(self.entry_table.item(row,0))
        self._manual_selected()

    def open_keypad_practice(self):
        """Optional familiar website keypad trainer, bundled as a LOCAL HTML file.

        The native Qt programme/entry table are primary; the simulator does
        NOT alter local designs and NEVER sends Omron communications.
        """
        if getattr(sys,"frozen",False):
            trainer=Path(sys.executable).resolve().parent/"program-tools"/"index.html"
        else:
            trainer=Path(__file__).resolve().parent.parent/"program-tools"/"index.html"
        if not trainer.exists():
            self.message("Offline keypad trainer unavailable",
                "The bundled practice page could not be found. The in-app manual "
                "entry table and complete printed guide still work without it.",True)
            return
        webbrowser.open(trainer.as_uri())
        self.log_event("Opened local, offline five-button keypad training page")

    def copy_manual(self):
        if getattr(self,"_manual_plan",None) is None:self.refresh_manual()
        if getattr(self,"_manual_plan",None):
            QApplication.clipboard().setText(plain_instructions(self._manual_plan))
            self.feedback.setText("Complete offline keypad entry instructions copied")

    def export_manual(self):
        self.update_programme()
        p=self.programmes[self.slot]
        try:p.validate()
        except Exception as exc:self.message("Programme invalid",str(exc),True);return
        path,_=QFileDialog.getSaveFileName(self,"Save manual keypad sheet",
                    f"E5CC-T-manual-programme-{self.slot}.html","HTML (*.html)")
        if not path:return
        try:save_manual(path,p,self.slot,self.inventory["fields"],self.draft)
        except Exception as exc:self.message("Manual export error",str(exc),True);return
        self.feedback.setText("Offline manual programming guide saved: "+path)
        self.message("Guide saved","The standalone front-panel guide was saved:\n"+path)

    def export_review(self):
        try:
            report=build_review(self.inventory,self.draft,selected_slot=self.slot)
            body=readable_review(report)
        except Exception as exc:self.message("Review unavailable",str(exc),True);return
        path,_=QFileDialog.getSaveFileName(self,"Save settings change report",
                        "E5CC-T-configuration-change-review.txt","Text (*.txt)")
        if not path:return
        try:Path(path).write_text(body,encoding="utf-8")
        except Exception as exc:self.message("Cannot save review",str(exc),True);return
        self.message("Review saved","Local change report saved without hardware writes:\n"+path)

    def export_inventory(self):
        if not self.inventory or self.inventory.get("mode")=="offline":
            self.message("No real inventory","Connect in Step 2 to read hardware or open a saved inventory.",True);return
        path,_=QFileDialog.getSaveFileName(self,"Export readable inventory",
                              "E5CC-T-parameter-inventory.txt","Text (*.txt)")
        if not path:return
        try:Path(path).write_text(report_inventory(self.inventory),encoding="utf-8")
        except Exception as exc:self.message("Export failed",str(exc),True)

    def closeEvent(self,event):
        if self.busy:
            self.message("USB operation in progress","Wait until the serial operation has finished.",True)
            event.ignore();return
        if self.session and self.session.ram_touched and not self.session.committed:
            if QMessageBox.question(self,"Unsaved RAM changes",
                 "Controller RAM may contain uncommitted data. Exit anyway?")!=QMessageBox.StandardButton.Yes:
                event.ignore();return
        self.log_event("Application closing; controller session terminating")
        self.connection_timer.stop()
        if self.client:
            try:self.client.close()
            except Exception:pass
        event.accept()


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--enable-lab-writes",action="store_true",
        help="Enable DA-only experimental writes with a heater physically isolated")
    args=parser.parse_args()
    app=QApplication(sys.argv[:1])
    app.setStyle("Fusion")
    app.setFont(QFont("Segoe UI",10))
    window=Studio(args.enable_lab_writes)
    window.show()
    sys.exit(app.exec())

if __name__=="__main__":
    main()
