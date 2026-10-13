"""Type-aware compact Omron programme segment editor, with accessible steppers.

Only the fields relevant to Ramp, Soak or Step are visible. The controls
emit local changes; they never issue serial commands to the controller.
"""
from __future__ import annotations

from PySide6.QtCore import Signal,Qt
from PySide6.QtWidgets import (
    QWidget,QFrame,QHBoxLayout,QVBoxLayout,QLabel,QComboBox,QDoubleSpinBox,
    QSpinBox,QAbstractSpinBox,QToolButton
)
from program_model import Segment


class Stepper(QWidget):
    """Labeled numeric editor with always-visible ▲/▼ buttons.

    These are actual QToolButtons, independent of Windows theme-specific
    QSpinBox arrow rendering.
    """
    def __init__(self,label,spin,parent=None):
        super().__init__(parent)
        shell=QVBoxLayout(self)
        shell.setContentsMargins(0,0,0,0)
        shell.setSpacing(4)
        header=QLabel(label)
        header.setObjectName("tiny")
        shell.addWidget(header)
        strip=QFrame()
        strip.setObjectName("stepperFrame")
        line=QHBoxLayout(strip)
        line.setContentsMargins(0,0,0,0)
        line.setSpacing(0)
        self.spin=spin
        spin.setButtonSymbols(QAbstractSpinBox.ButtonSymbols.NoButtons)
        spin.setMinimumHeight(36)
        spin.setMinimumWidth(72)
        spin.setFrame(False)
        spin.setAlignment(Qt.AlignmentFlag.AlignRight)
        line.addWidget(spin,1)
        arrows=QWidget()
        vert=QVBoxLayout(arrows)
        vert.setContentsMargins(0,0,0,0)
        vert.setSpacing(0)
        self.up=QToolButton()
        self.down=QToolButton()
        for control,sign,callback in (
            (self.up,"▲",spin.stepUp),(self.down,"▼",spin.stepDown)):
            control.setObjectName("spinArrow")
            control.setText(sign)
            control.setAutoRepeat(True)
            control.setFixedSize(31,18)
            control.clicked.connect(callback)
            vert.addWidget(control)
        line.addWidget(arrows)
        shell.addWidget(strip)
        self.setMinimumWidth(133)


class SegmentRow(QFrame):
    changed=Signal()
    move_up=Signal()
    move_down=Signal()
    duplicate=Signal()
    remove=Signal()

    def __init__(self,index:int,segment:Segment,parent=None):
        super().__init__(parent)
        self.setObjectName("segmentRow")
        self.setMinimumHeight(84)
        outer=QHBoxLayout(self)
        outer.setContentsMargins(15,10,15,10)
        outer.setSpacing(12)

        number=QLabel(f"{index+1:02}")
        number.setStyleSheet("font: 700 16px 'Segoe UI';color:#2778b3")
        number.setFixedWidth(26)
        outer.addWidget(number)

        typebox=QWidget()
        type_layout=QVBoxLayout(typebox)
        type_layout.setContentsMargins(0,0,0,0)
        type_layout.setSpacing(4)
        label=QLabel("SEGMENT TYPE")
        label.setObjectName("tiny")
        type_layout.addWidget(label)
        self.kind=QComboBox()
        self.kind.addItems(["ramp","soak","step"])
        self.kind.setCurrentText(segment.type)
        self.kind.setMinimumWidth(116)
        self.kind.setMinimumHeight(36)
        type_layout.addWidget(self.kind)
        outer.addWidget(typebox)

        target=QDoubleSpinBox()
        target.setRange(-20,500)
        target.setDecimals(1)
        target.setSingleStep(0.1)
        target.setSuffix(" °C")
        target.setValue(float(segment.sp))
        self.target=Stepper("TARGET TEMPERATURE",target)
        outer.addWidget(self.target)

        rate=QSpinBox()
        rate.setRange(1,9999)
        rate.setSingleStep(1)
        rate.setSuffix(" °C/min")
        rate.setValue(max(1,int(float(segment.rate))))
        self.rate=Stepper("RAMP RATE",rate)
        outer.addWidget(self.rate)

        hold=QSpinBox()
        hold.setRange(0,5999)
        hold.setSingleStep(1)
        hold.setSuffix(" min")
        hold.setValue(int(float(segment.minutes)))
        self.hold=Stepper("HOLD DURATION",hold)
        outer.addWidget(self.hold)

        self.meaning=QLabel()
        self.meaning.setObjectName("muted")
        self.meaning.setWordWrap(True)
        self.meaning.setMinimumWidth(110)
        outer.addWidget(self.meaning,1)

        buttonbar=QWidget()
        buttons=QHBoxLayout(buttonbar)
        buttons.setContentsMargins(0,0,0,0)
        buttons.setSpacing(3)
        for label,tip,signal in [
            ("↑","Move this segment earlier",self.move_up),
            ("↓","Move this segment later",self.move_down),
            ("⧉","Duplicate this segment",self.duplicate),
            ("×","Remove this segment",self.remove),
        ]:
            b=QToolButton()
            b.setObjectName("rowAction")
            b.setText(label)
            b.setToolTip(tip)
            b.setFixedSize(30,32)
            b.clicked.connect(signal.emit)
            buttons.addWidget(b)
        outer.addWidget(buttonbar)

        self.kind.currentTextChanged.connect(self._kind_changed)
        for stepper in (self.target,self.rate,self.hold):
            stepper.spin.valueChanged.connect(lambda *_:self.changed.emit())
        self._set_type(segment.type)

    def _kind_changed(self,value):
        self._set_type(value)
        self.changed.emit()

    def _set_type(self,value):
        self.target.setVisible(value in ("ramp","step"))
        self.rate.setVisible(value=="ramp")
        self.hold.setVisible(value=="soak")
        self.meaning.setText({
            "ramp":"Move the commanded setpoint toward a target at a defined rate.",
            "soak":"Hold the preceding commanded setpoint for a set time.",
            "step":"Change the commanded setpoint immediately.",
        }.get(value,""))
        self.rate.setToolTip("Only Ramp has a rate")
        self.hold.setToolTip("Only Soak has a hold time")

    def as_segment(self):
        kind=self.kind.currentText()
        if kind=="ramp":
            return Segment("ramp",sp=str(self.target.spin.value()),
                           rate=str(self.rate.spin.value()))
        if kind=="soak":
            return Segment("soak",minutes=str(self.hold.spin.value()))
        return Segment("step",sp=str(self.target.spin.value()))
