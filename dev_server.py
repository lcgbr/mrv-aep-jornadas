"""Dev server estático que NÃO cacheia (evita ter que dar Ctrl+F5 a cada mudança).
Uso: python dev_server.py [porta]   (default 8766). Serve esta pasta.
"""
import sys
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

DIRECTORY = str(Path(__file__).resolve().parent)


class NoCacheHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    print(f"Servindo {DIRECTORY} em http://127.0.0.1:{port} (no-cache)")
    ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()
