#!/usr/bin/env python3
"""Test the local static site server through HTTP."""

from pathlib import Path
import http.client
import socket
import subprocess
import sys
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
SERVER = ROOT / "scripts" / "serve-site.py"


class SiteServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            cls.port = sock.getsockname()[1]
        cls.base_url = f"http://127.0.0.1:{cls.port}"
        cls.process = subprocess.Popen(
            [sys.executable, str(SERVER), "--host", "127.0.0.1", "--port", str(cls.port)],
            cwd=ROOT,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for _ in range(50):
            if cls.process.poll() is not None:
                raise RuntimeError("site server exited before it accepted requests")
            try:
                with urlopen(cls.base_url, timeout=0.2):
                    break
            except (URLError, TimeoutError):
                time.sleep(0.05)
        else:
            cls.process.terminate()
            raise RuntimeError("site server did not start")

    @classmethod
    def tearDownClass(cls):
        cls.process.terminate()
        try:
            cls.process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            cls.process.kill()
            cls.process.wait()

    def test_serves_site_root_and_static_files(self):
        with urlopen(self.base_url + "/") as response:
            self.assertEqual(response.status, 200)
            self.assertIn(b"Event Modeling in HCL", response.read())

        with urlopen(self.base_url + "/assets/site.css") as response:
            self.assertEqual(response.status, 200)
            self.assertIn("text/css", response.headers.get_content_type())

    def test_head_returns_headers_without_body(self):
        request = Request(self.base_url + "/index.html", method="HEAD")
        with urlopen(request) as response:
            self.assertEqual(response.status, 200)
            self.assertEqual(response.read(), b"")

    def test_missing_page_and_parent_paths_return_404(self):
        with self.assertRaises(HTTPError) as result:
            urlopen(self.base_url + "/missing.html")
        self.assertEqual(result.exception.code, 404)
        result.exception.close()

        connection = http.client.HTTPConnection("127.0.0.1", self.port)
        connection.request("GET", "/../../../../etc/passwd")
        response = connection.getresponse()
        self.assertEqual(response.status, 404)
        connection.close()


if __name__ == "__main__":
    unittest.main()
