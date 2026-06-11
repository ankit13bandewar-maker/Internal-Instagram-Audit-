"""Simple HTTP server that sends no-cache headers for every file."""
import http.server
import os

PORT = 5000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        print(f"[Server] {self.address_string()} - {format % args}")

if __name__ == "__main__":
    with http.server.HTTPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Serving on http://localhost:{PORT}  (no-cache mode)")
        httpd.serve_forever()
