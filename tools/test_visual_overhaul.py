"""
Headless Firefox WebGL visual test for ExtinctionFighter overhauled 3D fighters.
Starts an ephemeral HTTP server, opens the Character Select screen and quick Battle
previews for specified fighters, verifies zero JS errors, checks that GLB models
hydrate cleanly, and saves screenshots to /tmp/extinctionfighter_visual_shots.
"""

import os
import sys
import tempfile
import time
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SHOT_DIR = os.path.join(tempfile.gettempdir(), "extinctionfighter_visual_shots")
os.makedirs(SHOT_DIR, exist_ok=True)


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def start_server():
    handler = partial(QuietHandler, directory=ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    port = server.server_address[1]
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server, port


def make_driver():
    opts = Options()
    opts.add_argument("-headless")
    opts.binary_location = "/run/current-system/sw/bin/firefox"
    # Enable software WebGL in headless Firefox
    opts.set_preference("webgl.force-enabled", True)
    opts.set_preference("layers.acceleration.force-enabled", True)
    driver = webdriver.Firefox(options=opts, service=Service())
    driver.set_window_size(1440, 900)
    return driver


ALL_OVERHAULED = [
    "ankylo", "anomalocaris", "apato", "dragon", "giantsloth",
    "maiasaura", "postosuchus", "pulmonoscorpius", "smilodon",
    "spinosaurus", "stegosaurus", "terabird", "therizino",
]


def wait_for_glbs(driver, expected=13, timeout=30.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        ready, count = driver.execute_script("""
            const roster = window.eval('typeof DINO_ROSTER !== "undefined" ? DINO_ROSTER : null');
            const ok = (!!roster && roster.length > 0 && typeof startMatch === 'function' && window._gameBooted);
            const cnt = window.FIGHTER_GLB_CACHE ? Object.keys(window.FIGHTER_GLB_CACHE).length : 0;
            return [!!ok, cnt];
        """)
        if ready and count >= expected:
            return count
        time.sleep(0.25)
    return driver.execute_script(
        "return window.FIGHTER_GLB_CACHE ? Object.keys(window.FIGHTER_GLB_CACHE).length : 0;"
    )


def main():
    targets = sys.argv[1:] or ALL_OVERHAULED
    server, port = start_server()
    base_url = f"http://127.0.0.1:{port}/index.html"
    driver = make_driver()
    errors = []

    try:
        # 1. Character Select Screen (unlock all, PvP mode, wait for all 13 GLBs)
        driver.get(f"{base_url}?screen=select&unlock=all&mode=pvp&p1={targets[0]}")
        driver.execute_script("""
            window.__testErrors = [];
            window.addEventListener('error', e => window.__testErrors.push(e.message));
            window.addEventListener('unhandledrejection', e => window.__testErrors.push(String(e.reason)));
        """)
        glbs_loaded = wait_for_glbs(driver, expected=len(ALL_OVERHAULED), timeout=30.0)
        select_p2 = targets[-1] if targets[-1] != "dragon" else "spinosaurus"
        driver.execute_script("""
            const fn = `(function(p2Id) {
                const idx2 = DINO_ROSTER.findIndex(d => d.id === p2Id);
                if (idx2 >= 0) {
                    p2ChoiceIndex = idx2;
                    if (typeof updateSelectUI === 'function') updateSelectUI();
                }
                if (typeof updatePreviewModels === 'function') updatePreviewModels(performance.now());
            })(${JSON.stringify(arguments[0])});`;
            window.eval(fn);
        """, select_p2)
        time.sleep(1.0)
        select_shot = os.path.join(SHOT_DIR, "select_screen.png")
        driver.save_screenshot(select_shot)
        errs = driver.execute_script("return window.__testErrors || [];")
        if errs:
            errors.extend(errs)
        print(f"[SELECT] saved {select_shot}, GLBs cached={glbs_loaded}, errors={len(errs)}")

        # 2. Peaceful idle Battle scene checks for every fighter pair
        # Pair the 12 roster fighters in PvP mode (no AI), plus apato vs dragon (DRAGON_BOSS in stage 6)
        roster_targets = [f for f in targets if f != "dragon"]
        has_dragon = "dragon" in targets
        pairs = []
        if has_dragon:
            p1_for_dragon = "apato" if "apato" in roster_targets else (roster_targets[0] if roster_targets else "ankylo")
            if p1_for_dragon in roster_targets:
                roster_targets.remove(p1_for_dragon)
            pairs.append((p1_for_dragon, "dragon"))
        for i in range(0, len(roster_targets), 2):
            p1 = roster_targets[i]
            p2 = roster_targets[i + 1] if i + 1 < len(roster_targets) else roster_targets[0]
            pairs.append((p1, p2))

        for p1, p2 in pairs:
            ok_set = driver.execute_script("""
                return window.eval(`(function(p1Id, p2Id) {
                    const i1 = DINO_ROSTER.findIndex(d => d.id === p1Id);
                    if (i1 < 0) return [i1, -1];
                    p1ChoiceIndex = i1;
                    if (p2Id === 'dragon') {
                        gameMode = 'campaign';
                        campaignStage = 6;
                    } else {
                        const i2 = DINO_ROSTER.findIndex(d => d.id === p2Id);
                        if (i2 < 0) return [i1, i2];
                        gameMode = 'pvp';
                        p2ChoiceIndex = i2;
                        currentArena = 'volcano';
                    }
                    startMatch();
                    return [i1, p2Id === 'dragon' ? 999 : p2ChoiceIndex];
                })(${JSON.stringify(arguments[0])}, ${JSON.stringify(arguments[1])});`);
            """, p1, p2)
            if ok_set[0] < 0 or ok_set[1] < 0:
                errors.append(f"Unknown fighter pair {p1}, {p2}: {ok_set}")
                continue
            time.sleep(0.8 if p2 == "dragon" else 1.5)
            shot = os.path.join(SHOT_DIR, f"battle_{p1}_vs_{p2}.png")
            driver.save_screenshot(shot)
            b_errs = driver.execute_script("return window.__testErrors || [];")
            driver.execute_script("window.__testErrors = [];")
            state_info = driver.execute_script("""
                return window.eval(`(function() {
                    if (typeof fighter1 === 'undefined' || !fighter1 || typeof fighter2 === 'undefined' || !fighter2) {
                        return 'no_fighters';
                    }
                    return {
                        p1: fighter1.dino ? fighter1.dino.id : null,
                        p2: fighter2.dino ? fighter2.dino.id : null,
                        p1Glb: !!(fighter1.rig && fighter1.rig._isGlbHydrated),
                        p2Glb: !!(fighter2.rig && fighter2.rig._isGlbHydrated)
                    };
                })();`);
            """)
            if state_info == 'no_fighters' or not (state_info['p1Glb'] and state_info['p2Glb']):
                errors.append(f"GLB hydration failed for {p1} vs {p2}: {state_info}")
            elif state_info['p1'] != p1 or state_info['p2'] != p2:
                errors.append(f"Fighter mismatch for {p1} vs {p2}: got {state_info}")
            if b_errs:
                errors.extend(b_errs)
            print(f"[BATTLE] {p1} vs {p2}: saved {shot}, state={state_info}, errors={len(b_errs)}")

    finally:
        driver.quit()
        server.shutdown()

    if glbs_loaded < len(ALL_OVERHAULED):
        errors.append(f"Expected {len(ALL_OVERHAULED)} cached GLBs, got {glbs_loaded}")
    if errors:
        print("ERRORS FOUND:", errors)
        sys.exit(1)
    print("VISUAL_TEST_PASSED")


if __name__ == "__main__":
    main()
