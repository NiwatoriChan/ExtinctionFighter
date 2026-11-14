#!/usr/bin/env bash
# ==============================================================================
# ExtinctionFighter Launcher — Local No-Cache HTTP Server for WebGL & GLB Assets
# ==============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"
OPEN_BROWSER=1
URL_QUERY=""

usage() {
    cat <<'EOF'
Usage: ./start.sh [OPTIONS]

Starts a local HTTP server (with Cache-Control: no-store so updated .glb models
always load fresh) and opens Extinction Kombat 3D in your browser.

Options:
  --unlock-all    Open directly on Character Select with all 16 fighters unlocked
  --port <N>      Starting port to bind (default: 8080; scans forward if busy)
  --no-browser    Start the server without opening a browser window
  -h, --help      Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --unlock-all)
            URL_QUERY="?screen=select&unlock=all"
            shift
            ;;
        --port)
            if [[ $# -lt 2 ]]; then
                echo "Error: --port requires a port number" >&2
                exit 1
            fi
            PORT="$2"
            shift 2
            ;;
        --no-browser)
            OPEN_BROWSER=0
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

run_python() {
    if command -v python3 >/dev/null 2>&1; then
        exec python3 "$@"
    elif command -v python >/dev/null 2>&1; then
        exec python "$@"
    elif command -v uv >/dev/null 2>&1; then
        exec uv run --no-project python "$@"
    else
        echo "Error: python3, python, or uv is required to start the local server." >&2
        exit 1
    fi
}

export EF_ROOT_DIR="$ROOT_DIR"
export EF_PORT="$PORT"
export EF_OPEN_BROWSER="$OPEN_BROWSER"
export EF_URL_QUERY="$URL_QUERY"

run_python - <<'PY'
import functools
import http.server
import os
import shutil
import signal
import socketserver
import subprocess
import sys
import threading
import time


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".glb": "model/gltf-binary",
        ".gltf": "model/gltf+json",
        ".svg": "image/svg+xml",
        ".wasm": "application/wasm",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        # Keep terminal clean except for 4xx/5xx errors
        if len(args) >= 2 and str(args[1]).startswith(("4", "5")):
            super().log_message(format, *args)


class ReusableThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def bind_server(directory, start_port):
    handler = functools.partial(NoCacheHandler, directory=directory)
    for port in range(start_port, start_port + 20):
        try:
            return ReusableThreadingHTTPServer(("127.0.0.1", port), handler), port
        except OSError:
            continue
    raise RuntimeError(f"No free port found in range {start_port}-{start_port + 19}")


def main():
    root_dir = os.environ["EF_ROOT_DIR"]
    start_port = int(os.environ.get("EF_PORT", "8080"))
    open_browser = os.environ.get("EF_OPEN_BROWSER", "1") == "1"
    url_query = os.environ.get("EF_URL_QUERY", "")

    server, bound_port = bind_server(root_dir, start_port)
    base_url = f"http://127.0.0.1:{bound_port}"
    launch_url = f"{base_url}/{url_query}"
    unlock_url = f"{base_url}/?screen=select&unlock=all"

    print("============================================================", flush=True)
    print("  EXTINCTION KOMBAT 3D - Local Server Ready", flush=True)
    print(f"  Game URL        : {launch_url}", flush=True)
    print(f"  All 16 Fighters : {unlock_url}", flush=True)
    print("  Cache-Control   : no-store (fresh GLB/JS reload enabled)", flush=True)
    print("  Press Ctrl+C to stop the server.", flush=True)
    print("============================================================", flush=True)

    stop_event = threading.Event()

    def handle_sig(_signum, _frame):
        stop_event.set()
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGINT, handle_sig)
    signal.signal(signal.SIGTERM, handle_sig)

    if open_browser and shutil.which("xdg-open"):
        def _open():
            time.sleep(0.25)
            if not stop_event.is_set():
                subprocess.Popen(
                    ["xdg-open", launch_url],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    start_new_session=True,
                )
        threading.Thread(target=_open, daemon=True).start()

    try:
        server.serve_forever()
    finally:
        server.server_close()
        print("\nServer stopped.", flush=True)


if __name__ == "__main__":
    main()
PY
