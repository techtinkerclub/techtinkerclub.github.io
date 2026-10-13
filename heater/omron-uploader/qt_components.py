"""Shared Qt widgets for the portable Omron Studio (no serial I/O)."""
from __future__ import annotations
from PySide6.QtCore import QObject, QRunnable, Signal, Qt
from PySide6.QtWidgets import (QFrame, QLabel, QVBoxLayout, QHBoxLayout,
                              QPushButton, QGraphicsDropShadowEffect, QWidget)
from PySide6.QtGui import QColor
import pyqtgraph as pg

BG="#f4f7fb"
NAVY="#1b344c"
BLUE="#086fd1"
MUTED="#627a90"
EDGE="#dce5ee"
GREEN="#157952"
AMBER="#a8610f"

STYLE = """
QMainWindow, QWidget#root { background: #f4f7fb; color: #1b344c; }
QFrame#card { background: white; border: 1px solid #dce5ee; border-radius: 12px; }
QFrame#header { background: #ffffff; border-bottom: 1px solid #dce5ee; }
QFrame#footer { background: #ffffff; border-top: 1px solid #dce5ee; }
QLabel { color: #1b344c; background: transparent; }
QLabel#muted { color: #627a90; }
QLabel#heading { font: 600 21px 'Segoe UI'; }
QLabel#subheading { font: 600 15px 'Segoe UI'; }
QLabel#tiny { color: #627a90; font: 11px 'Segoe UI'; }
QLabel#success { color: #137b54; }
QLabel#warning { color: #9e5d0c; }
QPushButton { background: #ffffff; border: 1px solid #d1deea; border-radius: 8px;
 padding: 9px 13px; font: 600 12px 'Segoe UI'; color:#245271; min-height:21px; }
QPushButton:hover { background: #eaf3fd; border-color: #8ebbea; }
QPushButton:disabled { background:#f0f3f6; color:#91a2b1; border-color:#e3e8ee; }
QPushButton[primary="true"] { color:white; background:#086fd1; border-color:#086fd1; }
QPushButton[primary="true"]:hover { background:#045db4; }
QPushButton[primary="true"]:disabled { color:#b1bfcc;background:#e8eef4;border-color:#e8eef4; }
QPushButton[nav="true"] { text-align:left; padding: 12px 16px; border:0;
 border-radius:8px; color:#59728b; background:transparent; }
QPushButton[nav="true"]:checked { background:#e6f1fc;color:#075bb3; }
QPushButton[nav="true"]:hover { background:#edf5fd; }
QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox { background:white; border:1px solid #d2e0eb;
 padding:7px;border-radius:7px; min-height:20px; color:#1b344c; }
QLineEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus, QComboBox:focus
 { border-color:#278bdd; }
QTableWidget { background:white; alternate-background-color:#f7fafc;
 border:1px solid #dae5ef; border-radius:7px;gridline-color:#e5edf5;
 selection-background-color:#deecfb;selection-color:#1b344c;}
QHeaderView::section { background:#f0f5fa; border:0; border-bottom:1px solid #d9e4ee;
 padding:9px;color:#41617c;font:600 12px 'Segoe UI'; }
QTextEdit { background:#ffffff; border:1px solid #dce5ee; border-radius:8px; }
QProgressBar { border:0; background:#e3edf7; border-radius:5px;height:8px; }
QProgressBar::chunk { background:#1584de; border-radius:5px; }
QScrollArea { border:none;background:transparent; }
QSplitter::handle { background:#e3eaf1; }
"""


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
