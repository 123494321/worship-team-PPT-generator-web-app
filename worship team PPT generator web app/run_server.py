"""
run_server.py
worship team PPT generator web app 통합 서버 실행기
"""

import os
import sys
import webbrowser
import threading
import time

SERVER_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server")
if SERVER_DIR not in sys.path:
    sys.path.insert(0, SERVER_DIR)

def open_browser(url, delay=1.5):
    def _open():
        time.sleep(delay)
        print(f"\n[LOGOS] 브라우저를 엽니다: {url}")
        webbrowser.open(url)
    threading.Thread(target=_open, daemon=True).start()

def main():
    import uvicorn

    host = "127.0.0.1"
    port = 8000
    url = f"http://{host}:{port}"

    print("=" * 60)
    print("  LOGOS Worship Team PPT Generator - Web Application")
    print(f"  접속 주소: {url}")
    print("=" * 60)

    open_browser(url)
    uvicorn.run("server.main:app", host=host, port=port, reload=False, log_level="info")

if __name__ == "__main__":
    main()
