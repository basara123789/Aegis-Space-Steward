import http.server
import socketserver
import subprocess
import os
import json
from urllib.parse import urlparse, parse_qs

# CONFIGURATION
# ---------------------------------------------------------
# UPDATE THIS PATH TO YOUR BAMBU STUDIO EXECUTABLE
BAMBU_PATH = r"C:\Program Files\Bambu Studio\bambu-studio.exe"
# ---------------------------------------------------------

PORT = 8999

class BridgeHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Handle CORS
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/status':
            self.wfile.write(json.dumps({"status": "ready", "printer": "Bambu Lab P1S"}).encode())
            
        elif parsed_path.path == '/print':
            try:
                print(f"🚀 Received command. Checking for Bambu Studio...")
                
                # PowerShell command to Find, Restore and Focus window
                ps_script = """
                $proc = Get-Process bambu-studio -ErrorAction SilentlyContinue
                if ($proc) {
                    $hwnd = $proc.MainWindowHandle
                    if ($hwnd) {
                        $user32 = Add-Type -MemberDefinition @"
                            [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
                            [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
"@ -Name Win32 -Namespace Win32 -PassThru
                        
                        # 9 = SW_RESTORE (Restores window if minimized)
                        $user32::ShowWindow($hwnd, 9)
                        $user32::SetForegroundWindow($hwnd)
                        Write-Output "FOCUSED"
                    } else {
                        Write-Output "NO_WINDOW"
                    }
                } else {
                    Write-Output "NOT_RUNNING"
                }
                """
                
                # Execute PowerShell
                result = subprocess.run(["powershell", "-Command", ps_script], capture_output=True, text=True).stdout.strip()
                
                if "FOCUSED" in result:
                    print("✅ Window focused successfully.")
                    self.wfile.write(json.dumps({"success": True, "message": "Bambu Studio Focused"}).encode())
                else:
                    print(f"🚀 Process Status: {result}. Launching new instance at: {BAMBU_PATH}")
                    if os.path.exists(BAMBU_PATH):
                        subprocess.Popen([BAMBU_PATH])
                        self.wfile.write(json.dumps({"success": True, "message": "Bambu Studio Launched"}).encode())
                    else:
                        self.wfile.write(json.dumps({"success": False, "message": "Executable not found. Check Path."}).encode())
                        
            except Exception as e:
                self.wfile.write(json.dumps({"success": False, "message": str(e)}).encode())
        else:
            self.wfile.write(json.dumps({"success": False, "message": "Unknown command"}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With")
        self.end_headers()

print(f"🌉 Aegis Bridge Server Active on PORT {PORT}")
print(f"🎯 Target App: {BAMBU_PATH}")
print("Leave this window open to allow browser connection...")

try:
    with socketserver.TCPServer(("", PORT), BridgeHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nBridge Closed.")
