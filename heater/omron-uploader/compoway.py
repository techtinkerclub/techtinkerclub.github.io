"""Strict CompoWay/F framing over E58-CIFQ2. H186 §§2-1,2-3.
No networking. `SerialClient` opens one COM port at 38400 7E2 (Omron setup cable).
Requires pyserial only at runtime, not to run protocol self-tests.
"""
from __future__ import annotations
import threading

class ProtocolError(RuntimeError): pass
class ControllerError(ProtocolError): pass
STX=2; ETX=3

def bcc(blob):
    c=0
    for b in blob:c^=b
    return c

def encode_request(cmd,node=1):
    if not (isinstance(cmd,str) and len(cmd)>=4 and cmd.isascii() and cmd.isalnum()):raise ValueError("Unsafe request text")
    if not 0<=node<=99:raise ValueError("Node must be 0..99")
    body=f"{node:02d}000{cmd}".encode("ascii")+bytes((ETX,))
    return bytes((STX,))+body+bytes((bcc(body),))

def parse_response(frame,service,node=1):
    if len(frame)<16 or frame[0]!=STX or frame[-2]!=ETX:raise ProtocolError("Missing STX/ETX / incomplete response")
    if bcc(frame[1:-1])!=frame[-1]:raise ProtocolError("Invalid BCC; response discarded")
    try:body=frame[1:-2].decode("ascii")
    except UnicodeDecodeError as e:raise ProtocolError("Non-ASCII response") from e
    # Response frame contains NODE 2, SUB 2, END CODE 2, MRC+SRC 4,
    # RESPONSE CODE 4, and optional payload. SID is not in responses.
    if body[:4]!=f"{node:02d}00":raise ProtocolError(f"Unexpected node/subaddress: {body[:4]!r}")
    if body[4:6]!="00":raise ControllerError("Omron end code: "+body[4:6])
    if body[6:10]!=service:raise ProtocolError("Wrong service in response")
    if body[10:14]!="0000":raise ControllerError("Omron response code: "+body[10:14])
    return body[14:]

class SerialClient:
    def __init__(self,port,node=1,timeout=1.8,write_allowed=False):
        try:import serial
        except ImportError as e:raise RuntimeError("PySerial is missing: install requirements or use portable EXE") from e
        self.serial=serial.Serial(port=port,baudrate=38400,bytesize=serial.SEVENBITS,
            parity=serial.PARITY_EVEN,stopbits=serial.STOPBITS_TWO,
            timeout=timeout,write_timeout=timeout,xonxoff=False,rtscts=False,dsrdtr=False)
        self.node=node;self.write_allowed=write_allowed;self.lock=threading.RLock()
    def close(self):self.serial.close()
    def query(self,cmd):
        with self.lock:
            self.serial.reset_input_buffer();self.serial.write(encode_request(cmd,self.node));self.serial.flush()
            first=self.serial.read(1)
            if first!=bytes((STX,)):raise ProtocolError(f"No response STX ({first.hex() if first else 'timeout'})")
            frame=bytearray(first)
            for _ in range(1024):
                x=self.serial.read(1)
                if not x:raise ProtocolError("Timeout before response ETX")
                frame.extend(x)
                if x==bytes((ETX,)):break
            else:raise ProtocolError("Response too long")
            check=self.serial.read(1)
            if not check:raise ProtocolError("Missing BCC")
            frame.extend(check)
            return parse_response(bytes(frame),cmd[:4],self.node)
    def identify(self):
        data=self.query("0503")
        if len(data)<14:raise ProtocolError("Short controller attributes payload")
        try:buf=int(data[10:14],16)
        except ValueError as e:raise ProtocolError("Invalid buffer size") from e
        return {"model10":data[:10].rstrip(),"buffer_bytes":buf}
    def status(self):return self.query("0601")
    def read(self,vtype,addr,count=1):
        if vtype not in ("DA","C0","C1","C3","C4","C5","C9"):raise ValueError("Variable type not allowlisted for read")
        if not (0<=addr<=0xffff and 1<=count<=25):raise ValueError("Invalid variable range")
        data=self.query(f"0101{vtype}{addr:04X}00{count:04X}")
        if len(data)!=count*8:raise ProtocolError(f"Read count mismatch at {vtype}:{addr:04X} expected {count*8} received {len(data)}")
        try:return [int(data[i:i+8],16) for i in range(0,len(data),8)]
        except ValueError as e:raise ProtocolError("Invalid hexadecimal payload") from e
    def read1(self,vtype,addr):return self.read(vtype,addr)[0]
    def _guard(self):
        if not self.write_allowed:raise PermissionError("Writes not enabled for this serial session")
    def write1(self,addr,value):
        self._guard();return self.query(f"0102DA{addr:04X}000001{value&0xffffffff:08X}")
    def operation(self,code,data):
        self._guard()
        allow={("00","01"),("04","01"),("05","00")}
        # Intentionally no RUN/RESET, firmware, setup area changes, or auto/manual.
        if (code,data) not in allow:raise PermissionError("Operation command not permitted")
        return self.query("3005"+code+data)
