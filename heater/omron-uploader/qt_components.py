"""Shared Qt widgets for the portable Omron Studio (no serial I/O)."""
from __future__ import annotations
from PySide6.QtCore import QObject, QRunnable, Signal, Qt, QRectF, QRect
from PySide6.QtWidgets import (QFrame, QLabel, QVBoxLayout, QHBoxLayout,
                              QPushButton, QWidget, QComboBox)
from PySide6.QtGui import QColor, QPainter, QPen, QPixmap, QIcon
import pyqtgraph as pg

BG="#f4f7fb"
NAVY="#1b344c"
BLUE="#086fd1"
MUTED="#627a90"
EDGE="#dce5ee"
GREEN="#157952"
AMBER="#a8610f"

STYLE = """
/* One control system across all five steps. Numeric and dropdown inputs share
   38px field chrome, the same border/typography, and pale-blue affordances. */
QMainWindow, QWidget#root { background: #f4f7fb; color: #1b344c; }
QFrame#card { background: white; border: 1px solid #dce5ee; border-radius: 12px; }
QFrame#header { background: #ffffff; border-bottom: 1px solid #dce5ee; }
QFrame#footer { background: #ffffff; border-top: 1px solid #dce5ee; }
QLabel { color: #1b344c; background: transparent; }
QLabel#muted { color: #627a90; }
QLabel#heading { font: 600 21px 'Segoe UI'; }
QLabel#subheading { font: 600 15px 'Segoe UI'; }
QLabel#tiny { color: #526f86; font: 600 10px 'Segoe UI'; }
QLabel#success { color: #137b54; }
QLabel#warning { color: #9e5d0c; }

QPushButton { background: #ffffff; border: 1px solid #cbddea; border-radius: 8px;
 padding: 8px 13px; font: 600 12px 'Segoe UI'; color: #245271; min-height: 22px; }
QPushButton:hover { background: #edf5fd; border-color: #95c2e7; }
QPushButton:pressed { background: #daeafb; }
QPushButton:disabled { background: #f0f3f6; color: #91a2b1; border-color: #e3e8ee; }
QPushButton[primary="true"] { color:white; background:#086fd1; border-color:#086fd1; }
QPushButton[primary="true"]:hover { background:#045db4; }
QPushButton[primary="true"]:disabled { color:#b1bfcc;background:#e8eef4;border-color:#e8eef4; }
QPushButton[nav="true"] { text-align:left; padding: 12px 16px; border:0;
 border-radius:8px; color:#59728b; background:transparent; }
QPushButton[nav="true"]:checked { background:#e6f1fc;color:#075bb3; }
QPushButton[nav="true"]:hover { background:#edf5fd; }

QLineEdit { background:#ffffff; border:1px solid #cbddea; border-radius:8px;
 padding:7px 10px; min-height:22px; color:#18334a;
 selection-background-color:#d4e9fb; selection-color:#18334a;
 font: 12px 'Segoe UI'; }
QLineEdit:focus { border-color:#278bdd; background:#ffffff; }
QLineEdit:disabled { background:#f3f6fa; color:#8a9bab; }
QComboBox { background:#ffffff; border:1px solid #cbddea; border-radius:8px;
 padding:7px 42px 7px 10px; min-height:22px; color:#18334a;
 font:600 12px 'Segoe UI'; selection-background-color:#d4e9fb; }
QComboBox:hover { border-color:#95c2e7; }
QComboBox:focus { border-color:#278bdd; }
QComboBox:disabled { background:#f3f6fa; color:#8a9bab; }
/* The entire dropdown/arrow is drawn consistently by StudioCombo.paintEvent. */
QComboBox::drop-down { subcontrol-origin: padding; subcontrol-position:top right;
 width:34px; border:0; background:transparent; }
QComboBox::down-arrow { image:none; width:0; height:0; }
QComboBox QAbstractItemView { background:#ffffff; border:1px solid #cbddea;
 color:#18334a; outline:none; selection-background-color:#e3f1fc;
 selection-color:#164e7b; padding:3px; }
QSpinBox,QDoubleSpinBox { background:white; border:1px solid #cbddea;
 color:#18334a; border-radius:8px; padding:7px 10px; min-height:22px; }
QSpinBox:focus,QDoubleSpinBox:focus { border-color:#278bdd; }

/* Numeric fields and dropdowns share the same outer shell. */
QFrame#valueField { background:#ffffff; border:1px solid #cbddea; border-radius:8px; }
QLineEdit#numericEntry { background:#ffffff; border:0; border-radius:0;
 padding:5px 7px; min-height:0; font:600 13px 'Segoe UI'; color:#18334a;
 selection-background-color:#d4e9fb; selection-color:#18334a; }
QLineEdit#numericEntry:focus { background:#ffffff; border:0; color:#18334a; }
QLabel#numericUnit { color:#526f86; background:#ffffff;
 font:11px 'Segoe UI'; padding:0 3px; }
QToolButton#spinArrow { background:#edf5fd; border:0; border-left:1px solid #dce7f0;
 border-radius:0; color:#24638e; }
QToolButton#spinArrow:hover { background:#dbeefd; }
QToolButton#spinArrow:pressed { background:#c9e4fa; }
QToolButton#rowAction { background:#ffffff; border:1px solid #cbddea; border-radius:7px; }
QToolButton#rowAction:hover { background:#edf5fd; border-color:#95c2e7; }
QToolButton#rowAction:pressed { background:#daeafb; }

QTableWidget { background:white; alternate-background-color:#f7fafc;
 border:1px solid #dae5ef; border-radius:8px; gridline-color:#e5edf5;
 selection-background-color:#deecfb; selection-color:#1b344c; }
QHeaderView::section { background:#f0f5fa; border:0; border-bottom:1px solid #d9e4ee;
 padding:9px; color:#41617c; font:600 12px 'Segoe UI'; }
QTableWidget#segmentRows { background:#ffffff; border:0; alternate-background-color:#ffffff; }
QTableWidget#segmentRows::item { background:#ffffff; border:0; }
QFrame#segmentRow { background:#f9fcff; border:1px solid #dbe7f1; border-radius:10px; }
QFrame#segmentRow:hover { border-color:#a6c8e5; }

QTextEdit { background:#ffffff; border:1px solid #dce5ee; border-radius:8px;
 color:#1b344c; selection-background-color:#d4e9fb; }
QTabWidget::pane { border:1px solid #dce5ee; background:#ffffff;
 border-radius:8px; top:-1px; }
QTabBar::tab { background:#f0f5fa; border:1px solid #dce5ee;
 padding:10px 16px; min-width:100px; color:#50718c;
 font:600 12px 'Segoe UI'; }
QTabBar::tab:selected { background:#ffffff; color:#0865b9;
 border-bottom-color:#ffffff; }
QTabBar::tab:hover:!selected { background:#e4effa; }
QCheckBox { color:#2b4b62; spacing:8px; font:12px 'Segoe UI'; }
QCheckBox::indicator { width:16px; height:16px; }
QProgressBar { border:0; background:#e3edf7; border-radius:5px;height:8px; }
QProgressBar::chunk { background:#1584de; border-radius:5px; }
QScrollArea { border:none; background:transparent; }
QSplitter::handle { background:#dde9f2; }
"""


def control_icon(name,colour="#28618d"):
    """Consistent vector icons for small controls, independent of system fonts."""
    pix=QPixmap(20,20)
    pix.fill(Qt.GlobalColor.transparent)
    painter=QPainter(pix)
    painter.setRenderHint(QPainter.RenderHint.Antialiasing,True)
    pen=QPen(QColor(colour),2)
    pen.setCapStyle(Qt.PenCapStyle.RoundCap)
    pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin)
    painter.setPen(pen)
    if name=="up":
        painter.drawLine(10,16,10,4)
        painter.drawLine(10,4,5,9)
        painter.drawLine(10,4,15,9)
    elif name=="down":
        painter.drawLine(10,4,10,16)
        painter.drawLine(10,16,5,11)
        painter.drawLine(10,16,15,11)
    elif name=="chevron-up":
        painter.drawLine(4,13,10,7)
        painter.drawLine(10,7,16,13)
    elif name=="chevron-down":
        painter.drawLine(4,7,10,13)
        painter.drawLine(10,13,16,7)
    elif name=="duplicate":
        painter.drawRect(QRect(3,3,10,11))
        painter.fillRect(QRect(7,7,10,11),QColor("#ffffff"))
        painter.drawRect(QRect(7,7,10,11))
    elif name=="remove":
        painter.drawLine(5,5,15,15)
        painter.drawLine(15,5,5,15)
    else:
        painter.end()
        raise ValueError("Unknown UI icon "+str(name))
    painter.end()
    return QIcon(pix)


class StudioCombo(QComboBox):
    """Shared Windows 11-style dropdown with a painted, non-font chevron.

    Unlike system/native arrow glyphs, this chevron has predictable weight
    and alignment at Windows 100%, 125% and 150% DPI. The popup and keyboard
    behaviour remain the native, accessible QComboBox implementation.
    """
    def __init__(self,parent=None):
        super().__init__(parent)
        self.setMinimumHeight(38)
        self.setSizeAdjustPolicy(QComboBox.SizeAdjustPolicy.AdjustToMinimumContentsLengthWithIcon)
        self.setMinimumContentsLength(5)

    def paintEvent(self,event):
        super().paintEvent(event)
        if self.width()<42:return
        painter=QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing,True)
        # This painted area intentionally matches Stepper's tinted button stack.
        r=self.rect()
        x=r.width()-34
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QColor("#edf5fd") if self.isEnabled() else QColor("#f1f4f7"))
        painter.drawRoundedRect(QRectF(x+1,1,32,r.height()-2),4,4)
        painter.setPen(QPen(QColor("#dce7f0"),1))
        painter.drawLine(x,5,x,r.height()-6)
        painter.setPen(QPen(QColor("#28618d") if self.isEnabled() else QColor("#9aaab7"),2))
        painter.drawLine(x+12,r.height()//2-3,x+18,r.height()//2+3)
        painter.drawLine(x+18,r.height()//2+3,x+24,r.height()//2-3)
        painter.end()


class WorkerSignals(QObject):
    result = Signal(object)
    error = Signal(str)
    progress = Signal(str)
    finished = Signal()


class Task(QRunnable):
    def __init__(self, work):
        super().__init__()
        self.work=work
        self.signals=WorkerSignals()
        self.setAutoDelete(False)

    def run(self):
        try:
            self.signals.result.emit(self.work(self.signals.progress.emit))
        except Exception as exc:
            self.signals.error.emit(f"{type(exc).__name__}: {exc}")
        finally:
            self.signals.finished.emit()


def card(padding=16, vertical=True):
    frame=QFrame()
    frame.setObjectName("card")
    layout=QVBoxLayout(frame) if vertical else QHBoxLayout(frame)
    layout.setContentsMargins(padding,padding,padding,padding)
    layout.setSpacing(10)
    return frame,layout


def heading(title,subtitle=None):
    box=QWidget()
    lay=QVBoxLayout(box);lay.setContentsMargins(0,0,0,0);lay.setSpacing(3)
    label=QLabel(title);label.setObjectName("heading");lay.addWidget(label)
    if subtitle:
        sub=QLabel(subtitle);sub.setObjectName("muted");sub.setWordWrap(True);lay.addWidget(sub)
    return box


def text(message, muted=False, wrap=True):
    label=QLabel(str(message))
    if muted:label.setObjectName("muted")
    label.setWordWrap(wrap)
    return label


def button(label,callback=None,primary=False):
    b=QPushButton(label)
    b.setProperty("primary",bool(primary))
    if callback:b.clicked.connect(callback)
    return b


class Profile(pg.PlotWidget):
    """Fast commanded-setpoint curve, not a measured-temperature trace."""
    def __init__(self,parent=None):
        super().__init__(parent)
        self.setBackground("w")
        self.setLabel("left","Commanded setpoint","°C")
        self.setLabel("bottom","Nominal elapsed time","min")
        self.showGrid(x=True,y=True,alpha=0.14)
        self.getPlotItem().getAxis("left").setTextPen(MUTED)
        self.getPlotItem().getAxis("bottom").setTextPen(MUTED)
        self.setMouseEnabled(x=True,y=True)
        self.curve=self.plot([],[],pen=pg.mkPen(BLUE,width=3),
                             symbol="o",symbolSize=7,symbolBrush=BLUE,
                             symbolPen=pg.mkPen("w",width=1))

    def show_points(self,points):
        if not points:
            self.curve.setData([],[])
            return
        self.curve.setData([float(x) for x,_ in points],
                           [float(y) for _,y in points])
        self.enableAutoRange()
