"""Type-aware compact Omron programme segment editor, with accessible steppers.

Only the fields relevant to Ramp, Soak or Step are visible. The controls
emit local changes; they never issue serial commands to the controller.
"""
from __future__ import annotations

from PySide6.QtCore import Signal,Qt,QSize
from PySide6.QtWidgets import (
    QWidget,QFrame,QHBoxLayout,QVBoxLayout,QLabel,QComboBox,QDoubleSpinBox,
    QSpinBox,QAbstractSpinBox,QToolButton,QLineEdit
)
from qt_components import StudioCombo,control_icon
from program_model import Segment


class Stepper(QWidget):
    """Visible QLineEdit + up/down buttons; hidden spinbox validates the number.

    QSpinBox embeds a QLineEdit which was rendered at an unusable width when
    nested in the application's global Windows QSS. Here *only* the ordinary,
    readable QLineEdit is presented. The original spinbox still supplies
    validated range/precision and stepUp/stepDown; its valueChanged signal
    remains the single source of truth for the programme model.
    """
    def __init__(self,label,spin,parent=None):
        super().__init__(parent)
        self.spin=spin
        self.spin.setParent(self)
        self.spin.hide()
        self._syncing=False
        self._invalid=False
        shell=QVBoxLayout(self)
        shell.setContentsMargins(0,0,0,0)
        shell.setSpacing(4)
        header=QLabel(label)
        header.setObjectName("tiny")
        shell.addWidget(header)

        strip=QFrame()
        strip.setObjectName("valueField")
        strip.setFixedHeight(38)
        line=QHBoxLayout(strip)
        line.setContentsMargins(0,0,0,0)
        line.setSpacing(0)

        self.editor=QLineEdit()
        self.editor.setObjectName("numericEntry")
        self.editor.setMinimumWidth(62)
        self.editor.setMinimumHeight(35)
        self.editor.setAlignment(Qt.AlignmentFlag.AlignRight)
        self.editor.setAccessibleName(label)
        self.editor.setToolTip(f"{label}. Type a value or use the up/down arrows.")
        line.addWidget(self.editor,1)

        units=spin.suffix().strip()
        self.suffix_label=QLabel(units)
        self.suffix_label.setObjectName("numericUnit")
        self.suffix_label.setVisible(bool(units))
        line.addWidget(self.suffix_label,0)

        arrows=QWidget()
        vert=QVBoxLayout(arrows)
        vert.setContentsMargins(0,0,0,0)
        vert.setSpacing(0)
        self.up=QToolButton()
        self.down=QToolButton()
        for control,name,callback in (
            (self.up,"chevron-up",self.spin.stepUp),
            (self.down,"chevron-down",self.spin.stepDown)):
            control.setObjectName("spinArrow")
            control.setIcon(control_icon(name))
            control.setIconSize(QSize(13,13))
            control.setAutoRepeat(True)
            control.setFixedSize(34,19)
            control.setAccessibleName(("Increase" if control is self.up else "Decrease")+" "+label)
            control.setToolTip(control.accessibleName())
            control.clicked.connect(lambda checked=False,fn=callback:fn())
            vert.addWidget(control)
        line.addWidget(arrows)
        shell.addWidget(strip)
        self.setMinimumWidth(153)

        # Only the line edit is painted. Spinbox internals cannot clip text.
        self.spin.valueChanged.connect(self._value_updated)
        self.editor.textEdited.connect(self._typed_value)
        self.editor.editingFinished.connect(self._finish_edit)
        self._value_updated(self.spin.value())

    def _display_value(self):
        value=self.spin.value()
        if isinstance(self.spin,QDoubleSpinBox):
            return f"{value:.{self.spin.decimals()}f}"
        return str(value)

    def _value_updated(self,*args):
        if not self._syncing:
            self.editor.setText(self._display_value())
            self.editor.setProperty("invalid",False)

    def _typed_value(self,text):
        raw=text.strip().replace(",",".")
        if not raw or raw in ("-","+","-.","."):
            self._invalid=True
            return
        try:
            number=float(raw) if isinstance(self.spin,QDoubleSpinBox) else int(raw)
        except (ValueError,OverflowError):
            self._invalid=True
            return
        if not self.spin.minimum() <= number <= self.spin.maximum():
            self._invalid=True
            return
        if isinstance(self.spin,QSpinBox) and not raw.lstrip("-").isdigit():
            self._invalid=True
            return
        self._invalid=False
        self._syncing=True
        try:
            # Emits valueChanged, which updates the live programme and plot.
            self.spin.setValue(number)
        finally:
            self._syncing=False

    def _finish_edit(self):
        # If the user left incomplete/invalid text, revert to the last valid
        # numeric value rather than silently using a different quantity.
        raw=self.editor.text().strip()
        self._typed_value(raw)
        self._value_updated()
        self._invalid=False

    def set_unit(self,unit):
        """Update the painted unit label (not just the hidden spinbox)."""
        self.spin.setSuffix(" "+unit if unit else "")
        self.suffix_label.setText(unit)
        self.suffix_label.setVisible(bool(unit))

    def is_valid_display(self):
        return (not self._invalid and
                bool(self.editor.text().strip()) and
                self.editor.text().strip().replace(",",".") != "-")


class SegmentRow(QFrame):
    changed=Signal()
    move_up=Signal()
    move_down=Signal()
    duplicate=Signal()
    remove=Signal()

    def __init__(self,index:int,segment:Segment,parent=None,temperature_min=-20,temperature_max=500,display_unit="°C"):
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
        self.kind=StudioCombo()
        self.kind.addItems(["ramp","soak","step"])
        self.kind.setCurrentText(segment.type)
        self.kind.setMinimumWidth(116)
        self.kind.setMinimumHeight(38)
        type_layout.addWidget(self.kind)
        outer.addWidget(typebox)

        target=QDoubleSpinBox()
        # Preserve an existing out-of-range target for explicit correction;
        # never silently clamp/change the stored programme on settings updates.
        original_target=float(segment.sp)
        target.setRange(min(float(temperature_min),original_target),
                        max(float(temperature_max),original_target))
        target.setDecimals(3)
        target.setSingleStep(0.1)
        target.setSuffix(" "+display_unit)
        target.setValue(float(segment.sp))
        self.target=Stepper("TARGET TEMPERATURE" if display_unit=="°C" else "TARGET VALUE",target)
        outer.addWidget(self.target)

        rate=QDoubleSpinBox()
        # A K input-6 slope of 0.2°C/min must never be rounded to 0 or 1.
        rate.setDecimals(3)
        rate.setRange(0.001,9999.0)
        rate.setSingleStep(0.1)
        rate.setSuffix(" "+display_unit+"/min")
        rate.setValue(float(segment.rate))
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
        for symbol,tip,signal in [
            ("up","Move this segment earlier",self.move_up),
            ("down","Move this segment later",self.move_down),
            ("duplicate","Duplicate this segment",self.duplicate),
            ("remove","Remove this segment",self.remove),
        ]:
            b=QToolButton()
            b.setObjectName("rowAction")
            b.setIcon(control_icon(symbol))
            b.setIconSize(QSize(18,18))
            b.setAccessibleName(tip)
            b.setToolTip(tip)
            b.setFixedSize(32,34)
            b.clicked.connect(lambda checked=False,sig=signal:sig.emit())
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
