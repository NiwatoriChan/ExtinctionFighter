import os
import subprocess
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import shutil

PORT = 8126
os.makedirs('screenshots', exist_ok=True)
os.makedirs('/tmp/ff_test_profile', exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

server = HTTPServer(('127.0.0.1', PORT), QuietHandler)
t = threading.Thread(target=server.serve_forever, daemon=True)
t.start()
time.sleep(1)

FIREFOX_BIN = shutil.which('firefox') or '/run/current-system/sw/bin/firefox'

print("1. Capturing Anomalocaris on Character Select Screen...")
cap_select_path = os.path.abspath("screenshots/anomalocaris_select_screen.png")
cmd_select = [
    FIREFOX_BIN,
    '--headless',
    '--profile', '/tmp/ff_test_profile',
    '--window-size=1280,720',
    '--screenshot', cap_select_path,
    f'http://127.0.0.1:{PORT}/index.html?unlock=anomalocaris&p1=anomalocaris&screen=select'
]
res1 = subprocess.run(cmd_select, capture_output=True, text=True, timeout=25)
print("Select Screen ReturnCode:", res1.returncode)

time.sleep(1)

print("2. Capturing Anomalocaris in Match (Battle)...")
cap_battle_path = os.path.abspath("screenshots/anomalocaris_in_match.png")
cmd_battle = [
    FIREFOX_BIN,
    '--headless',
    '--profile', '/tmp/ff_test_profile',
    '--window-size=1280,720',
    '--screenshot', cap_battle_path,
    f'http://127.0.0.1:{PORT}/index.html?unlock=anomalocaris&p1=anomalocaris&screen=battle'
]
res2 = subprocess.run(cmd_battle, capture_output=True, text=True, timeout=25)
print("Battle Screen ReturnCode:", res2.returncode)

print("\nVerifying files on disk:")
for p in [cap_select_path, cap_battle_path]:
    if os.path.exists(p):
        print(f"[SUCCESS] Generated: {p} ({os.path.getsize(p)} bytes)")
    else:
        print(f"[FAIL] Missing: {p}")
