#!/usr/bin/env python3
"""Local preview server for the AIgnite Insights site. Run: python3 server.py"""
import http.server, socketserver, os
PORT = 8012
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()
with socketserver.TCPServer(("", PORT), H) as httpd:
    print(f"AIgnite preview at http://localhost:{PORT}")
    httpd.serve_forever()
