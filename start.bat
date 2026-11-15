@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ==============================================================================
REM ExtinctionFighter Launcher (Windows) — Local No-Cache HTTP Server for WebGL & GLB
REM ==============================================================================

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
if not defined PORT set "PORT=8080"
set "OPEN_BROWSER=1"
set "URL_QUERY="

:parse_args
if "%~1"=="" goto args_done
if /i "%~1"=="--unlock-all" (
    set "URL_QUERY=?screen=select&unlock=all"
    shift
    goto parse_args
)
if /i "%~1"=="--port" (
    if "%~2"=="" (
        echo Error: --port requires a port number 1>&2
        exit /b 1
    )
    set "PORT=%~2"
    shift
    shift
    goto parse_args
)
if /i "%~1"=="--no-browser" (
    set "OPEN_BROWSER=0"
    shift
    goto parse_args
)
if /i "%~1"=="-h" goto show_help
if /i "%~1"=="--help" goto show_help
if "%~1"=="/?" goto show_help

echo Unknown option: %~1 1>&2
goto show_help_error

:show_help
echo Usage: start.bat [OPTIONS]
echo.
echo Starts a local HTTP server (with Cache-Control: no-store so updated .glb models
echo always load fresh) and opens Extinction Kombat 3D in your browser.
echo.
echo Options:
echo   --unlock-all    Open directly on Character Select with all 16 fighters unlocked
echo   --port ^<N^>      Starting port to bind (default: 8080; scans forward if busy)
echo   --no-browser    Start the server without opening a browser window
echo   -h, --help      Show this help message
exit /b 0

:show_help_error
call :show_help 1>&2
exit /b 1

:args_done
set "EF_ROOT_DIR=%ROOT_DIR%"
set "EF_PORT=%PORT%"
set "EF_OPEN_BROWSER=%OPEN_BROWSER%"
set "EF_URL_QUERY=%URL_QUERY%"
set "EF_SELF_PATH=%~f0"

REM Prefer Python (py -3, python, python3, uv); fall back to built-in PowerShell HttpListener
where py >nul 2>&1
if %errorlevel%==0 (
    py -3 -c "import os; exec(open(os.environ['EF_SELF_PATH'], encoding='utf-8').read().rsplit('#__PYTHON_START__', 1)[1])"
    exit /b %errorlevel%
)

where python >nul 2>&1
if %errorlevel%==0 (
    python -c "import os; exec(open(os.environ['EF_SELF_PATH'], encoding='utf-8').read().rsplit('#__PYTHON_START__', 1)[1])"
    exit /b %errorlevel%
)

where python3 >nul 2>&1
if %errorlevel%==0 (
    python3 -c "import os; exec(open(os.environ['EF_SELF_PATH'], encoding='utf-8').read().rsplit('#__PYTHON_START__', 1)[1])"
    exit /b %errorlevel%
)

where uv >nul 2>&1
if %errorlevel%==0 (
    uv run --no-project python -c "import os; exec(open(os.environ['EF_SELF_PATH'], encoding='utf-8').read().rsplit('#__PYTHON_START__', 1)[1])"
    exit /b %errorlevel%
)

where powershell >nul 2>&1
if %errorlevel%==0 (
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$raw = [System.IO.File]::ReadAllText($env:EF_SELF_PATH, [System.Text.Encoding]::UTF8); $parts = $raw -split '#__POWERSHELL_START__'; $code = ($parts[$parts.Length - 1] -split '#__POWERSHELL_END__')[0]; Invoke-Expression $code"
    exit /b %errorlevel%
)

echo Error: Python 3 (python / py) or PowerShell is required to start the local server. 1>&2
pause
exit /b 1

REM ==============================================================================
REM Embedded PowerShell Fallback Server (used only when Python is not installed)
REM ==============================================================================
#__POWERSHELL_START__
$rootDir = [System.IO.Path]::GetFullPath($env:EF_ROOT_DIR)
$startPort = 8080
if ($env:EF_PORT) { $startPort = [int]$env:EF_PORT }
$openBrowser = ($env:EF_OPEN_BROWSER -eq '1')
$urlQuery = if ($env:EF_URL_QUERY) { $env:EF_URL_QUERY } else { '' }

$listener = $null
$boundPort = $null
for ($p = $startPort; $p -lt ($startPort + 20); $p++) {
    $tryListener = New-Object System.Net.HttpListener
    $tryListener.Prefixes.Add("http://127.0.0.1:$p/")
    try {
        $tryListener.Start()
        $listener = $tryListener
        $boundPort = $p
        break
    } catch {
        $tryListener.Close()
    }
}

if (-not $listener) {
    throw "No free port found in range $startPort-$($startPort + 19)"
}

$baseUrl = "http://127.0.0.1:$boundPort"
$launchUrl = "$baseUrl/$urlQuery"
$unlockUrl = "$baseUrl/?screen=select&unlock=all"

Write-Host "============================================================"
Write-Host "  EXTINCTION KOMBAT 3D - Local Server Ready"
Write-Host "  Game URL        : $launchUrl"
Write-Host "  All 16 Fighters : $unlockUrl"
Write-Host "  Cache-Control   : no-store (fresh GLB/JS reload enabled)"
Write-Host "  Press Ctrl+C to stop the server."
Write-Host "============================================================"

if ($openBrowser) {
    Start-Process $launchUrl
}

$mimeMap = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.mjs'  = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.glb'  = 'model/gltf-binary'
    '.gltf' = 'model/gltf+json'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.webp' = 'image/webp'
    '.wasm' = 'application/wasm'
    '.ico'  = 'image/x-icon'
}

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $reqPath = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
        if ($reqPath -eq '/') { $reqPath = '/index.html' }
        $relPath = $reqPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $fullPath = [System.IO.Path]::GetFullPath((Join-Path $rootDir $relPath))
        $res = $ctx.Response
        $res.Headers.Add('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        $res.Headers.Add('Pragma', 'no-cache')
        $res.Headers.Add('Expires', '0')

        if (-not $fullPath.StartsWith($rootDir, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            $res.StatusCode = 404
            $res.Close()
            continue
        }

        $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
        $res.ContentType = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
    }
} finally {
    $listener.Stop()
    $listener.Close()
}
#__POWERSHELL_END__

REM ==============================================================================
REM Embedded Python 3 Server (preferred on Windows when Python is installed)
REM ==============================================================================
#__PYTHON_START__
import functools
import http.server
import os
import signal
import socketserver
import threading
import time
import webbrowser


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
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, handle_sig)

    if open_browser:
        def _open():
            time.sleep(0.25)
            if not stop_event.is_set():
                webbrowser.open(launch_url)

        threading.Thread(target=_open, daemon=True).start()

    try:
        server.serve_forever()
    finally:
        server.server_close()


main()
