/* Source: Omron H185-E1-08, Appendix A-9 parameter flow (pp. A-38–A-40);
   Appendix A-6 parameter operation lists (A-18–A-33); H186 communications
   manual. CONDITIONAL visibility is an estimate for training, not a physical
   readback. Order follows the printed parameter flow, with omissions possible.
   Do not treat this file as a controller write map. */
window.OMRON_ATLAS = {version:"2026-10-14",source:"H185-E1-08, A-9",levels:{}}; 
(function(){
 const levels=window.OMRON_ATLAS.levels;
 function section(id,title,help,rows){
  levels[id]={id,title,help,entries:rows.trim().split("\n").map((line,idx)=>{
   const [code,name,why,flags="",branch=""]=line.trim().split("~");
   return {id:id+"-"+idx,code,name,why,flags:flags.split(",").filter(Boolean),branch};
  })};
 }

section("operation","Operation level","Everyday display and RUN/RESET operation. MODE moves to the next available screen; missing options are skipped.",`
PV/SP~Process value and setpoint~Shows measured PV and commanded SP. Two values can differ during a ramp.
PV/SP 2~Alternate process display~Second PV/SP display format; appearance depends on display configuration.
a-m~Auto/manual switch~Select automatic control or manual output where manual mode is enabled.~manual
pgsg~Programme / segment monitor~Shows which programme and segment are selected or running.
prg~Programme number~Selects the memory that will RUN (0–7). Different from d.prg, which selects what to edit.
hold~Programme hold~Holds or releases programme timing; availability follows running state and assignment.
seg~Segment number~Displays or changes active segment subject to RUN mode/protection.
stbm~Standby remaining time~Time remaining during a configured programme standby period.
prgt~Elapsed programme time~Monitor of elapsed programme time, not a segment SP.
rptm~Execution repetitions~Shows repetitions already performed.
ct1~Heater current CT1/CT2~Readout from a fitted current transformer, not a measure supplied by the panel voltmeter.~ct1
lcr1~Leakage current CT1/CT2~Monitors heater-short leakage with supported CT equipment.~ct1
r-r~RUN / RESET~Controls the controller programme state. RUN may cause heating once outputs are powered.
o~Heating manipulated variable~Requested heating output percentage, NOT measured heater current.
c-o~Cooling manipulated variable~Requested cooling output percentage if heating/cooling is configured.~heatcool
v-m~Valve opening monitor~Position-proportional output display; not normally fitted on E5CC-T.~motor
`);
section("program","Programme setting level","Press LEVEL briefly from Operation. d.prg chooses the EDIT memory. MODE moves through a branch for selected segment, then programme-wide fields.",`
d.prg~Display programme selection~Choose memory 0–7 to EDIT; this does not select programme for RUN.~~program-select
s-no~Number of segments used~Active segments 1–32; segment indexes are 0–31.
d.seg~Display segment selection~Choose 0…(s-no−1) for segment fields, or END for programme-wide fields.~~segment-select
styp~Segment format~RAMP changes SP at a rate, SOAK holds current SP for time, STEP changes SP immediately.~segment~segment
sp~Segment setpoint~Target setpoint for RAMP or STEP. Engineering resolution follows in-t and SP limits.~segment,setpoint~segment
pr~Segment slope~Rate of setpoint change for RAMP. Unit comes from pru; physical PV may lag.~segment,ramp~segment
time~Segment time~Duration for SOAK or time-based programming. H.MM is hours/minutes, not decimal hours.~segment,soak~segment
pid~Programme PID set~At d.seg=END choose PID set 0 (automatic) or 1–8 for this programme.~end
al-1~Alarm value 1~Programme-dependent alarm threshold 1; effect depends on configured alarm type/output.~end,alarm
al-2~Alarm value 2~Programme-dependent alarm threshold 2 if available.~end,alarm
al-3~Alarm value 3~Programme-dependent alarm threshold 3 if available.~end,alarm
al-4~Alarm value 4~Programme-dependent alarm threshold 4 on supported models.~end,alarm,aux4
al1h~Alarm 1 upper limit~Upper half of a two-sided alarm when alarm type requires it.~end,alarm
al1l~Alarm 1 lower limit~Lower half of a two-sided alarm when alarm type requires it.~end,alarm
rpt~Programme repetitions~How many times to repeat the selected programme; zero disables repeats.~end
link~Programme link destination~END or another programme memory to execute after this one.~end
ts1s~Time signal 1 segment~Segment number used as the start reference for time signal 1.~end,signals
on1~Time signal 1 ON time~Time within programme when time signal 1 switches on.~end,signals
of1~Time signal 1 OFF time~Time within programme when time signal 1 switches off.~end,signals
ts2s~Time signal 2 segment~Segment number used as the start reference for time signal 2.~end,signals
on2~Time signal 2 ON time~Time within programme when time signal 2 switches on.~end,signals
of2~Time signal 2 OFF time~Time within programme when time signal 2 switches off.~end,signals
`);
section("adjustment","Adjustment level","From Operation, press LEVEL briefly twice. MODE cycles readouts and the currently active PID adjustment settings.",`
l.adj~Adjustment level entry~Brief introductory display, shown once upon entering.
at~Autotune execute/cancel~Starts or cancels auto-tuning; can drive real outputs when controller is powered.~pid
cmwt~Communications writing~Write-enable state for CompoWay/F; it does not itself start/stop heating.
spmd~Setpoint mode~PSP uses programme setpoint, FSP uses fixed setpoint.
fsp~Fixed SP~Target used when fixed-SP mode is selected.
ct1~Heater current 1/2~Live CT current monitor; only with CT hardware.~ct1
hb1~Heater burnout threshold 1/2~Sets alarm threshold for missing heater current.~ct1
lcr1~Leakage current monitor~Current leakage/short monitor via CT.~ct1
hs1~Heater short alarm 1/2~Configures heater short alarm threshold via CT.~ct1
ins~PV input shift~Offset for measured PV, not a sensor-type change.
inrt~PV input slope coefficient~Gain correction; changes how physical measurement maps to display.
wt-b~Wait band~GLOBAL tolerance around SP required before segment advances. OFF means no wait; applies to all eight programmes.
stb~Standby time~Delay before programme execution; units depend on advanced setting.
psps~Programme SP shift~GLOBAL shift applied to the programme setpoint trajectory.
p~Proportional band~Current active PID set P band; not a separate ninth PID bank.~pid
i~Integral time~Current active PID set I term; affects removal of steady-state error.~pid
d~Derivative time~Current active PID set D term; adds response to rate of change.~pid
c-p~Cooling proportional band~Cooling-side PID P, only for heating/cooling mode.~pid,heatcool
c-i~Cooling integral time~Cooling-side I term.~pid,heatcool
c-d~Cooling derivative time~Cooling-side D term.~pid,heatcool
c-db~Dead band~Overlap or gap between heating and cooling outputs.~heatcool
of-r~Manual reset value~Offset used with proportional control without integral action.
hys~Heating hysteresis~Switching band for ON/OFF control.~onoff
chys~Cooling hysteresis~Cooling ON/OFF switching band.~heatcool,onoff
mv-r~MV at RESET~Output value when in RESET. Verify a physical safe-off state independently.
mv-e~MV at PV error~Configured output during process-value/sensor error.
ol-h~MV upper limit~Maximum permitted requested output percent.
ol-l~MV lower limit~Minimum permitted requested output percent.
orl~MV change-rate limit~Limits how fast requested output can change.
db~Position proportional dead band~Motor-position dead band; other family/hardware only.~motor
oc-h~Open/close hysteresis~Motor opening/closing dead band.~motor
sqrp~Square-root low-cut point~Low-level cut when square-root extraction enabled for analog input.~analog
w1on~Work bit 1–8 ON delay~Delay before a selected work-bit signal asserts; variants repeat per bit.~signals
w1of~Work bit 1–8 OFF delay~Delay before a selected work-bit signal clears; variants repeat per bit.~signals
plcm~Communications monitor~Communications status monitor if communications fitted.~serial
`);
section("pid","PID setting level","Short LEVEL cycles to PID Setting Level from the normal level loop. Select one of eight stored banks with d.pid, then step through its parameters.",`
d.pid~Display PID selection~Select stored PID bank 1–8 for INSPECTION / EDIT, distinct from programme pid assignment.~~pid-select
1.p~PID proportional band~P band for the selected bank; 1. prefix becomes chosen bank number.~pid
1.i~PID integral time~I constant in current bank.~pid
1.d~PID derivative time~D constant in current bank.~pid
1.c-p~PID cooling proportional band~Cooling-side P of selected PID bank.~pid,heatcool
1.c-i~PID cooling integral time~Cooling-side I of selected PID bank.~pid,heatcool
1.c-d~PID cooling derivative time~Cooling-side D of selected PID bank.~pid,heatcool
1.cdb~PID dead band~Heating/cooling overlap or deadband in this PID bank.~pid,heatcool
1.ofr~PID manual reset value~Manual reset bias for P control.~pid
1.olh~PID MV upper limit~Per-PID-bank upper output limit.~pid
1.oll~PID MV lower limit~Per-PID-bank lower output limit.~pid
1.aut~PID automatic-selection range~Range boundary used for selecting PID bank automatically.~pid
1.lba~PID loop burnout detection time~Condition/availability depends on alarm and control configuration.~pid,alarm
`);
section("initial","Initial setting level","Hold LEVEL ≥3 seconds from Operation. Control stops in this level. Changing input type can reinterpret ALL stored programmes.",`
in-t~Input type~Universal input codes 0–29. Check the actually wired thermocouple, RTD, IR or analogue sensor.~~sensor
in-h~Analogue scaling upper~Engineering high-end value for mA/V input; not used for thermocouple/RTD.~analog
in-l~Analogue scaling lower~Engineering low-end value for mA/V input.~analog
dp~Decimal point~Analogue engineering value decimal placement.~analog
d-u~Temperature unit~°C or °F for temperature-type input. Analogue input uses engineering units.~temperature
sl-h~Setpoint upper limit~GLOBAL permitted setpoint ceiling for all programmes.
sl-l~Setpoint lower limit~GLOBAL permitted setpoint floor for all programmes.
t-u~Programme time unit~Hours/minutes or minutes/seconds for segment duration.
t-pr~Programming method~Rate-of-rise or step-time programming; determines visible segment parameters.~~method
pru~Ramp-rate time unit~Setpoint units per minute/hour; relevant to rate-of-rise programming.~rate
rtsm~Reset operation~Whether regulation is stopped in RESET; requires commissioning.
p-on~Startup operation~Controller behaviour on power return. Use approved reset behavior.
eset~End operation~RESET at end or CONTINUE regulation at last SP; GLOBAL.
pvst~PV start~Whether a ramp begins from current PV or programme SP reference.
tspu~All-PID AT upper-limit SP~Upper SP applied during a collective autotune procedure.~pid
cntl~Control algorithm~PID or ON/OFF selection (not all subsequent menu items apply).
s-hc~Heating/cooling selection~Standard heating or dual heating/cooling control.
cp~Heating output cycle~Control-period value for pulsed output; dependent on output hardware.
c-cp~Cooling output cycle~Period of cooling control output if fitted.~heatcool
orev~Direct/reverse operation~Choose heating reverse action or cooling direct action as appropriate.
alt1~Alarm 1 type~Alarm algorithm and threshold interpretation; depends on output assignments.~alarm
alt2~Alarm 2 type~Additional alarm type if available.~alarm
alt3~Alarm 3 type~Third alarm type if available.~alarm
alt4~Alarm 4 type~Fourth alarm type if model/auxiliary supports it.~alarm,aux4
alh1~Alarm 1 hysteresis~Anti-chatter band for alarm output 1.~alarm
alh2~Alarm 2 hysteresis~Anti-chatter band for alarm output 2.~alarm
alh3~Alarm 3 hysteresis~Anti-chatter band for alarm output 3.~alarm
alh4~Alarm 4 hysteresis~Anti-chatter band for alarm output 4.~alarm,aux4
o1st~Control output 1 signal~Current-output type where linear output hardware is fitted.~current1
o2st~Control output 2 signal~Current-output type on models with matching hardware.~current2
trst~Transfer-output signal~4–20 mA or matching transfer signal, if fitted.~transfer
tr-t~Transfer-output type~What measured/commanded parameter is transferred.~transfer
tr-h~Transfer-output upper~Engineering upper limit of retransmitted analogue signal.~transfer
tr-l~Transfer-output lower~Engineering lower limit of retransmitted analogue signal.~transfer
ev-1~Event input 1 assignment~Action triggered by physical event input 1; depends on installed options.~event1
ev-2~Event input 2 assignment~Action triggered by physical event input 2; depends on installed options.~event2
ev-3~Event input 3 assignment~Assignment on selected four-event or special hardware variants.~event3
ev-4~Event input 4 assignment~Assignment on selected four-event or special hardware variants.~event4
ev-5~Event input 5 assignment~Only on models with such extra input hardware; not E5CC-T basic.~event5
ev-6~Event input 6 assignment~Only on models with such extra input hardware; not E5CC-T basic.~event6
clfl~Closed/floating type~Position-proportional valve drive mode.~motor
calb~Motor calibration~Valve motor travel calibration; not standard E5CC-T outputs.~motor
mot~Motor travel time~Valve opening/closing travel time.~motor
vl-c~Valve fully-closed position~Calibrated feedback at closed stop.~motor
vl-o~Valve fully-open position~Calibrated feedback at open stop.~motor
pms~Potentiometer specification~Motor feedback potentiometer setting.~motor
sqr~Square-root extraction~Process-input square-root conversion, typically analogue instruments.~analog
amov~Move to advanced setting~After clearing protect settings, documented value −169 enters Advanced Function Setting Level.~protected
`);
section("protect","Protect level","Hold LEVEL + MODE together (typically ≥3 seconds) from Operation. Changing protections can lock access; record settings.",`
pmov~Move to protect level~Timing/password setting for entry to this protection menu.
oapt~Operation/adjustment protect~Prevents edits in routine levels; can hide controls.
icpt~Initial setting/communications protect~Blocks entry to system/communication settings if active.
wtpt~Setting change protect~Prevents writing a range of parameters.
pfpt~PF key protect~Locks programmable PF key function.
pmsk~Parameter mask enable~Hides parameters, so MODE can skip documented items.
prlp~Protection password~Password needed for some protection access; never assume displayed zero is actual secret.~protected
`);
section("communications","Communications setting level","Reach from Initial Setting with short LEVEL only on a communications-equipped model. A serial-address/format change can drop communication.",`
psel~Protocol setting~CompoWay/F or another supported protocol.~serial
u-no~Communications unit number~Controller serial node address; changing can interrupt active communication.~serial
bps~Baud rate~Serial link speed; must match host and is applied after restart.~serial
len~Data length~Number of data bits on RS-485 link.~serial
sbit~Stop bits~Number of serial stop bits.~serial
prty~Parity~Serial parity mode.~serial
sdwt~Send-data wait time~Delay before serial response.~serial
maxu~Highest communications unit number~Highest address for connected group.~serial
area~Communications area~Data area selected for transfer operations.~serial
rdadr~First address upper/lower~Address for bulk communications operation.~serial
rdata~Receive-data wait time~Receive timeout for communications.~serial
unlc~Communications node number~Additional unit number setting for supported special link mode.~serial
up~Upload setting~Bulk settings transfer from controller in supported configurations.~serial
dn~Download setting~Bulk settings transfer to controller in supported configurations.~serial
copy~Copy settings~Copies settings between linked supported units.~serial
`);
section("advanced","Advanced function setting level","Hidden behind approved protection changes and amov=-169. These parameters affect safety, output behaviour and availability of other menus.",`
init~Parameter initialization~Resets parameters to factory defaults; can erase approved configuration.~protected
pend~Programme end ON time~Delay/hold interval at programme completion.
s-u~Standby time unit~Unit of configured standby time.
rest~Standby sequence reset~How sequence restarts after standby.
sb1n~Auxiliary 1 open on alarm~Auxiliary contact default/operating polarity.~aux1
hbu~Heater burnout ON/OFF~Enables heater burnout detection (requires CT hardware).~ct1
hbl~Heater burnout latch~Latches heater-break alarm until acknowledgement.~ct1
hbh~Heater burnout hysteresis~Adds anti-chatter band to heater-break detection.~ct1
alfa~Alpha~PID 2-degree-of-freedom tuning coefficient.~pid
t-ud~Integral/derivative time unit~Scale of PID I/D constants.~pid
at-g~AT calculated gain~Autotune calculation scaling.~pid
at-h~AT hysteresis~Hysteresis used in autotune evaluation.~pid
lcma~Limit-cycle MV amplitude~Output swing during limit cycle tuning.~pid
inf~Input digital filter~Smooths measured PV; adds delay.
mav~Moving-average count~Number of samples averaged for the PV display.
ret~Automatic display return time~Return to PV/SP after inactivity.
brgt~Display brightness~Front panel brightness.
altc~Alarm 1–4 latch~Retains alarm until reset where enabled.~alarm
prlt~Move to protect level time~Delay before protection entry.
cjc~Cold junction compensation~Thermocouple compensation method.~temperature
a1on~Alarm 1 ON delay~Delay before alarm 1 asserts.~alarm
a1of~Alarm 1 OFF delay~Delay before alarm 1 clears.~alarm
a2on~Alarm 2 ON delay~Delay before alarm 2 asserts.~alarm
a2of~Alarm 2 OFF delay~Delay before alarm 2 clears.~alarm
a3on~Alarm 3 ON delay~Delay before alarm 3 asserts.~alarm
a3of~Alarm 3 OFF delay~Delay before alarm 3 clears.~alarm
a4on~Alarm 4 ON delay~Delay before alarm 4 asserts.~alarm,aux4
a4of~Alarm 4 OFF delay~Delay before alarm 4 clears.~alarm,aux4
manl~Manual output method~How manual MV is applied.~manual
mani~Manual MV initial value~Start value for manually selected output; safety relevant.~manual
rt~RT~Response-tuning-related parameter.~pid
hsu~Heater-short alarm use~Enables heater-short detection.~ct1
hsl~Heater-short alarm latch~Retains short alarm when enabled.~ct1
hsh~Heater-short alarm hysteresis~Short alarm switching dead band.~ct1
lba~LBA detection time~Detects insufficient process response to output.~alarm
lbal~LBA level~Magnitude required for loop burnout detection.~alarm
lbab~LBA band~Band used by loop burnout algorithm.~alarm
out1~Control output 1 assignment~Maps selected controller function to primary output.
out2~Control output 2 assignment~Maps selected function to second control output.~output2
sub1~Auxiliary output 1 assignment~Selects alarm, event or other function assigned to auxiliary 1.~aux1
sub2~Auxiliary output 2 assignment~Selects function assigned to auxiliary 2.~aux2
sub3~Auxiliary output 3 assignment~Selects function assigned to auxiliary 3.~aux3
sub4~Auxiliary output 4 assignment~Selects function assigned to auxiliary 4.~aux4
alma~Integrated alarm assignment~Combined/aggregate alarm output behaviour.~alarm
alsp~Alarm SP selection~Whether alarm evaluates fixed/programmed SP.~alarm
sprt~SP tracking~Tracks selected SP when switching operating modes.
p-dt~PID set auto-select data~Quantity used to choose PID sets automatically.~pid
p-dh~PID set hysteresis~Stops rapid switching between auto-selected PID banks.~pid
p-db~PV dead band~PV interval used for automatic bank selection.~pid
mrlm~Manual MV limit enable~Applies permitted MV limits while manual output is selected.~manual
pmvd~Direct position-proportional MV~Motor MV mode.~motor
pvrp~PV rate-of-change calculation period~Sampling time for rate-of-change features.
h-cm~Heating/cooling tuning method~How tuning handles both heat and cool output.~heatcool
ompu~Minimum output ON/OFF band~Avoid excessively fast switching for output contact.
lcml~Limit-cycle minimum ON time~Minimum on-time during limit-cycle tuning.~pid
pf~PF setting~Maps front-panel PF key to shortcut/function.
pfd1~PF monitor / setting item 1~Choose what the first programmable monitor shows.
pfd2~PF monitor / setting items 2–5~Choose additional quick-view contents.
spdp1~PV/SP 1 display choice~Selects what first PV/SP screen shows.
spdp2~PV/SP 2 display choice~Selects what second PV/SP screen shows.
pvst~PV status display~Whether special PV status is shown.
svst~SV status display~Whether special setpoint status is shown.
d.ref~Display refresh period~Sets update rate of displayed numbers.
burn~Burnout method~Selects burnout failure handling.
pms~Parameter mask setting~Controls which menus or fields are visible.
cmov~Move to calibration level~Specialist calibration entry; not normal programming and may change accuracy.~protected
`);
section("manual","Manual control level","Only when manual control is enabled and accessed from a-m. Output may energise attached equipment.",`
PV/MV~Manual manipulated variable~Shows process measurement and directly editable output demand. Use isolated commissioning only.~manual
`);
section("monitor","Monitor/setting item level","PF-programmed quick displays; up to five items selected by advanced PFD1–5 assignments.",`
PFD1~Monitor/setting item 1~Contents configured by PFD1; could be PV, SP or status.
PFD2~Monitor/setting item 2~Contents configured by PFD2; visibility depends on PF assignment.
PFD3~Monitor/setting item 3~Contents configured by PFD3.
PFD4~Monitor/setting item 4~Contents configured by PFD4.
PFD5~Monitor/setting item 5~Contents configured by PFD5.
`);
window.OMRON_ATLAS.sourceLinks={
 H185:"https://files.omron.eu/downloads/latest/manual/en/h185_e5_c-t_users_manual_en.pdf",
 H186:"https://files.omron.eu/downloads/latest/manual/en/h186_e5_c-t_digital_temperature_controllers_communications_manual_en.pdf",
 H185Page:"A-38 to A-40"
};
})();