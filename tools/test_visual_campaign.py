import os
import subprocess
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

PORT = 8125
os.makedirs('screenshots', exist_ok=True)
os.makedirs('/tmp/ff_test_profile', exist_ok=True)

import json

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass
    def do_POST(self):
        if self.path == '/api/log':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                print(f"[BROWSER {data.get('type')}]", data.get('data'))
            except Exception as e:
                print("[BROWSER LOG ERR]", e)
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"ok":true}')
        else:
            self.send_response(404)
            self.end_headers()

server = HTTPServer(('127.0.0.1', PORT), QuietHandler)
t = threading.Thread(target=server.serve_forever, daemon=True)
t.start()
time.sleep(1)

FIREFOX_BIN = '/nix/store/bfd2xf7qr3z7y6i7xs8xw0ljpgjjh6pf-firefox-159.0.1/bin/firefox'

print("1. Capturing Campaign Map Screenshot...")
cap_map_path = os.path.abspath("screenshots/campaign_map_screenshot.png")
cmd_map = [
    FIREFOX_BIN,
    '--headless',
    '--profile', '/tmp/ff_test_profile',
    '--window-size=1280,720',
    '--screenshot', cap_map_path,
    f'http://127.0.0.1:{PORT}/index.html?screen=campaign'
]
res1 = subprocess.run(cmd_map, capture_output=True, text=True, timeout=25)
print("Campaign Map ReturnCode:", res1.returncode)

time.sleep(1)

print("2. Capturing Smash Melee Wave 1 (Minions Swarm)...")
cap_minions_path = os.path.abspath("screenshots/smash_wave1_minions.png")
cmd_minions = [
    FIREFOX_BIN,
    '--headless',
    '--profile', '/tmp/ff_test_profile',
    '--window-size=1280,720',
    '--screenshot', cap_minions_path,
    f'http://127.0.0.1:{PORT}/index.html?mode=smash_level&era=0&wave=1&test=1'
]
res2 = subprocess.run(cmd_minions, capture_output=True, text=True, timeout=25)
print("Smash Minions ReturnCode:", res2.returncode)

time.sleep(1)

print("3. Capturing Smash Melee Wave 3 (Colossal Boss Battle)...")
cap_boss_path = os.path.abspath("screenshots/smash_wave3_boss.png")
cmd_boss = [
    FIREFOX_BIN,
    '--headless',
    '--profile', '/tmp/ff_test_profile',
    '--window-size=1280,720',
    '--screenshot', cap_boss_path,
    f'http://127.0.0.1:{PORT}/index.html?mode=smash_level&era=0&wave=3&test=1'
]
res3 = subprocess.run(cmd_boss, capture_output=True, text=True, timeout=25)
print("Smash Boss ReturnCode:", res3.returncode)

time.sleep(1)

print("4. Capturing Era Victory & Unlocked Rewards Modal...")
cap_victory_path = os.path.abspath("screenshots/smash_victory_rewards.png")
cmd_victory = [
    FIREFOX_BIN,
    '--headless',
    '--profile', '/tmp/ff_test_profile',
    '--window-size=1280,720',
    '--screenshot', cap_victory_path,
    f'http://127.0.0.1:{PORT}/index.html?mode=smash_level&era=0&victory=1&test=1'
]
res4 = subprocess.run(cmd_victory, capture_output=True, text=True, timeout=25)
print("Smash Victory ReturnCode:", res4.returncode)

server.shutdown()

print("\nVerifying files on disk:")
for name in ['campaign_map_screenshot.png', 'smash_wave1_minions.png', 'smash_wave3_boss.png', 'smash_victory_rewards.png']:
    p = os.path.join('screenshots', name)
    if os.path.exists(p):
        print(f"[SUCCESS] Generated: {p} ({os.path.getsize(p)} bytes)")
    else:
        print(f"[FAIL] Missing: {p}")
