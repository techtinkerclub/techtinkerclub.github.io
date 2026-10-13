"""Open an offline, version-matched copy of the website's Programme Studio.

The build embeds ../program-tools/index.html. The HTML is copied into a stable
user-writable directory so a browser can retain its own local data between runs.
No local network server, internet connection or controller cable is required.
"""
from __future__ import annotations
import os
import re
import sys
import webbrowser
from pathlib import Path

HOME = "https://techtinker.club/heater/"
HELP = "https://techtinker.club/heater/omron-programming/"

def bundled_source():
    root = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))
    packaged = root / "offline" / "index.html"
    if packaged.is_file():
        return packaged
    development = Path(__file__).resolve().parent.parent / "program-tools" / "index.html"
    if development.is_file():
        return development
    raise FileNotFoundError(
        "Bundled offline Programme Studio is missing. Rebuild with "
        "--add-data ../program-tools/index.html;offline"
    )

def prepare_html(source_text):
    # GitHub Pages' Jekyll front matter is not valid standalone HTML.
    html = re.sub(r"\A---\s*\n.*?\n---\s*\n", "", source_text, count=1, flags=re.S)
    if not html.lstrip().lower().startswith("<!doctype html>"):
        raise ValueError("Programme Studio resource does not contain standalone HTML")
    html = html.replace('href="../omron-programming/', 'href="' + HELP)
    html = html.replace('href="../"', 'href="' + HOME + '"')
    # Frontend is intentionally identical to website source; external links
    # remain optional documentation resources, never software requirements.
    notice = ('<div style="padding:8px 24px;background:#e8f3fb;'
              'border-bottom:1px solid #c7ddeb;color:#1d587e;font:'
              '600 12px Segoe UI,Arial,sans-serif">'
              'OFFLINE DESKTOP EDITION · Full website creator + five-button '
              'simulator · No cable or internet required · '
              'Export project JSON regularly for backup</div>')
    return html.replace("<body>", "<body>" + notice, 1)

def local_copy(directory=None):
    target_dir = (Path(directory) if directory is not None else
                  Path(os.getenv("LOCALAPPDATA", str(Path.home()))) /
                  "E5CC Programme Studio")
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / "Offline Programme Studio.html"
    text = prepare_html(bundled_source().read_text(encoding="utf-8"))
    # Stable file URL across launches; don't rewrite if identical.
    if not target.exists() or target.read_text(encoding="utf-8") != text:
        target.write_text(text, encoding="utf-8")
    return target

def open_studio(directory=None, opener=None):
    path = local_copy(directory)
    result = (opener or webbrowser.open)(path.resolve().as_uri())
    # Browser API may return False even when launched under managed Windows.
    return path, result
