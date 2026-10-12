#!/usr/bin/env python3
"""Read-only Omron E5CC-T E58-CIFQ2 connection probe.

This script contains exactly one controller command: 0503 (Read Controller Attributes).
It cannot enter RUN/RESET, change a parameter, enter a protected setting area,
or save nonvolatile memory. Requires Python 3 and pyserial for a live connection.

Usage:
    python omron_e5cct_read_only_probe.py --self-test
    python omron_e5cct_read_only_probe.py --list-ports
    python omron_e5cct_read_only_probe.py --port COM4

Reference: Omron H186 CompoWay/F communications manual, §§2-1 and 2-3-5.
The E58-CIFQ2 setup cable uses 38400 baud, 7E2.
"""
from __future__ import annotations

import argparse
import sys

STX = 0x02
ETX = 0x03
READ_CONTROLLER_ATTRIBUTES = b"0503"  # The ONLY service this program sends.


def checksum(bytes_without_stx_including_etx: bytes) -> int:
    bcc = 0
    for byte in bytes_without_stx_including_etx:
        bcc ^= byte
    return bcc


def make_request(node: int = 1) -> bytes:
    if not 0 <= node <= 99:
        raise ValueError("Node must be 0 through 99")
    # Node (two ASCII), subaddress '00', SID '0', service code '0503'.
    body = f"{node:02d}000".encode("ascii") + READ_CONTROLLER_ATTRIBUTES
    payload = body + bytes([ETX])
    return bytes([STX]) + payload + bytes([checksum(payload)])


def decode_response(raw: bytes, node: int = 1) -> dict[str, str]:
    if len(raw) < 17 or raw[0] != STX or raw[-2] != ETX:
        raise ValueError("Incomplete or malformed CompoWay/F frame")
    calc_bcc = checksum(raw[1:-1])
    if calc_bcc != raw[-1]:
        raise ValueError(f"BCC mismatch: expected {calc_bcc:02X}, received {raw[-1]:02X}")
    try:
        body = raw[1:-2].decode("ascii")
    except UnicodeDecodeError as exc:
        raise ValueError("Non-ASCII response body") from exc
    if not body.startswith(f"{node:02d}00"):
        raise ValueError(f"Unexpected node/subaddress: {body[:4]!r}")
    # RESPONSE: NODE(2) SUB(2) END(2) MRC/SRC(4) RESPONSE(4)
    #           MODEL(10) BUFFER(4). There is NO SID in the response frame.
    end_code = body[4:6]
    service = body[6:10]
    response_code = body[10:14]
    if end_code != "00":
        raise ValueError(f"Omron communications end code {end_code}")
    if service != "0503":
        raise ValueError(f"Unexpected returned service: {service!r}")
    if response_code != "0000":
        raise ValueError(f"Omron command response code {response_code}")
    if len(body) < 28:
        raise ValueError(f"Response too short to contain 10-byte model and buffer size: {body!r}")
    model = body[14:24]
    buffer_hex = body[24:28]
    try:
        buffer_size = int(buffer_hex, 16)
    except ValueError as exc:
        raise ValueError(f"Invalid buffer-size field {buffer_hex!r}") from exc
    return {"model_prefix": model.rstrip(), "buffer_size": str(buffer_size),
            "end_code": end_code, "response_code": response_code}


def run_self_test() -> None:
    # A synthetic E5CC-family response, NOT a real hardware capture.
    body = b"01000005030000E5CC-TQX3A00D9"
    payload = body + bytes([ETX])
    mock_response = bytes([STX]) + payload + bytes([checksum(payload)])
    decoded = decode_response(mock_response)
    assert decoded["model_prefix"] == "E5CC-TQX3A", decoded
    assert decoded["buffer_size"] == "217", decoded
    assert make_request()[:10] == b"\x02010000503", make_request()
    try:
        decode_response(mock_response[:-1] + bytes([mock_response[-1] ^ 1]))
    except ValueError as e:
        assert "BCC mismatch" in str(e)
    else:
        raise AssertionError("Corrupted BCC was not rejected")
    print("SELF-TEST PASSED: frame encoding, model parsing, bad-BCC detection.")


def load_pyserial():
    try:
        import serial
        from serial.tools import list_ports
    except ImportError:
        sys.exit("PySerial is not installed. On a computer where installation is permitted, run: python -m pip install pyserial")
    return serial, list_ports


def main() -> int:
    parser = argparse.ArgumentParser(description="Read-only Omron E5CC-T identity probe (0503 only).")
    parser.add_argument("--port", help="COM port to use, e.g. COM4")
    parser.add_argument("--node", type=int, default=1, help="Controller node, default 1")
    parser.add_argument("--list-ports", action="store_true", help="List serial ports without sending anything")
    parser.add_argument("--self-test", action="store_true", help="Test packet logic without hardware or PySerial")
    args = parser.parse_args()
    if args.self_test:
        run_self_test()
        return 0
    if not (args.port or args.list_ports):
        parser.error("Provide --port COMx, --list-ports, or --self-test")
    serial, list_ports = load_pyserial()
    if args.list_ports:
        ports = list(list_ports.comports())
        if not ports:
            print("No serial ports detected. Check the Omron USB driver and cable connection.")
        for port in ports:
            print(f"{port.device}: {port.description}")
        return 0
    if not 0 <= args.node <= 99:
        parser.error("--node must be between 0 and 99")
    request = make_request(args.node)
    print("READ-ONLY mode: one 0503 (Read Controller Attributes) command. No writes supported.")
    print(f"Port: {args.port} | Baud: 38400 | 7 data, EVEN parity, 2 stop bits | node: {args.node:02d}")
    print("TX:", request.hex(" ").upper())
    try:
        with serial.Serial(port=args.port, baudrate=38400, bytesize=serial.SEVENBITS,
                           parity=serial.PARITY_EVEN, stopbits=serial.STOPBITS_TWO,
                           timeout=2.0, write_timeout=2.0, xonxoff=False,
                           rtscts=False, dsrdtr=False) as port:
            port.reset_input_buffer()
            port.write(request)
            port.flush()
            first = port.read(1)
            if first != bytes([STX]):
                raise ValueError(f"No valid STX received (first byte: {first.hex() or 'TIMEOUT'})")
            # Read at most 300 bytes, stopping at ETX; BCC follows ETX.
            frame = bytearray(first)
            for _ in range(300):
                c = port.read(1)
                if not c:
                    raise ValueError("Response timed out before ETX")
                frame.extend(c)
                if c == bytes([ETX]):
                    break
            else:
                raise ValueError("Response exceeded 300 bytes without ETX")
            bcc = port.read(1)
            if not bcc:
                raise ValueError("Response had no trailing BCC")
            frame.extend(bcc)
        print("RX:", bytes(frame).hex(" ").upper())
        result = decode_response(bytes(frame), args.node)
        print("SUCCESS: Omron CompoWay/F response received and BCC verified.")
        print("10-character model identification:", result["model_prefix"])
        print("Communications buffer:", result["buffer_size"], "bytes")
        print("Note: 0503 returns only a 10-character model ID; check the full '-000' suffix on the nameplate.")
        print("No settings were read or modified beyond the controller's public identity response.")
        return 0
    except (serial.SerialException, OSError, ValueError) as exc:
        print("PROBE FAILED (no configuration changes attempted):", exc, file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
