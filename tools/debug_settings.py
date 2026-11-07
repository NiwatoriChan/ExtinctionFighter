import os
import subprocess
import time
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

PORT = 8129
logs = []

class CustomHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/log':
            length = int(self.headers.get('content-length', 0))
            body = self.rfile.read(length).decode('utf-8')
            logs.append(json.loads(body))
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

server = HTTPServer(('127.0.0.1', PORT), CustomHandler)
t = threading.Thread(target=server.serve_forever, daemon=True)
t.start()
time.sleep(1)

FIREFOX_BIN = '/run/current-system/sw/bin/firefox'
cap_path = os.path.abspath("screenshots/settings_debug.png")
cmd = [
    FIREFOX_BIN,
    '--headless',
    '--profile', '/tmp/ff_dbg_profile',
    '--window-size=1280,720',
    '--screenshot', cap_path,
    f'http://127.0.0.1:{PORT}/index.html?screen=settings&test=1'
]
res = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
time.sleep(1)
server.shutdown()

print("Captured logs count:", len(logs))
for l in logs:
    print(l)
