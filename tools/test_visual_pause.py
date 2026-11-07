import os
import subprocess
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

PORT = 8129
os.makedirs('screenshots', exist_ok=True)
os.makedirs('/tmp/ff_pause_profile', exist_ok=True)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

server = HTTPServer(('127.0.0.1', PORT), QuietHandler)
t = threading.Thread(target=server.serve_forever, daemon=True)
t.start()
time.sleep(1)

FIREFOX_BIN = '/run/current-system/sw/bin/firefox'

print("Capturing Pause Menu Screenshot (1280x720)...")
cap_path = os.path.abspath("screenshots/pause_menu_screenshot.png")
cmd = [
    FIREFOX_BIN,
    '--headless',
    '--profile', '/tmp/ff_pause_profile',
    '--window-size=1280,720',
    '--screenshot', cap_path,
    f'http://127.0.0.1:{PORT}/index.html?screen=battle&pause=1'
]
res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
print("ReturnCode:", res.returncode)
if res.stderr:
    print("Stderr:", res.stderr[:300])

server.shutdown()

if os.path.exists(cap_path):
    print(f"[SUCCESS] Generated: {cap_path} ({os.path.getsize(cap_path)} bytes)")
else:
    print(f"[FAIL] Missing: {cap_path}")
