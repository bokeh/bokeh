#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import os
import shutil
import subprocess
import sys
import time
from collections.abc import Iterator
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

# External imports
import pytest

playwright = pytest.importorskip("playwright.sync_api")


PROXY_KIND = os.environ.get("BOKEH_ASGI_PROXY")
pytestmark = pytest.mark.skipif(
    PROXY_KIND not in {"nginx", "apache"} or sys.platform != "linux",
    reason="requires the Linux nightly ASGI proxy job",
)

HERE = Path(__file__).parent
REPO_ROOT = HERE.parents[2]
CONFIG_ROOT = REPO_ROOT / "examples" / "server" / "deployment" / "asgi"
PUBLIC_URL = "http://127.0.0.1:8080/services/bokeh/"


def _wait_for_http(url: str, process: subprocess.Popen[bytes] | None = None) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process is not None and process.poll() is not None:
            raise RuntimeError(f"Process exited with status {process.returncode} while waiting for {url}")
        try:
            with urlopen(url, timeout=1) as response:
                if response.status < 500:
                    return
        except (OSError, URLError):
            pass
        time.sleep(0.2)
    raise TimeoutError(f"Timed out waiting for {url}")


def _stop_process(process: subprocess.Popen[bytes]) -> None:
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=10)


@pytest.fixture(scope="module")
def asgi_backend() -> Iterator[None]:
    assert PROXY_KIND is not None
    artifact_dir = REPO_ROOT / "work" / "asgi-proxy" / PROXY_KIND
    artifact_dir.mkdir(parents=True, exist_ok=True)
    with (artifact_dir / "uvicorn.log").open("wb") as log:
        process = subprocess.Popen([
            sys.executable,
            "-m", "uvicorn",
            "app:application",
            "--app-dir", str(HERE),
            "--host", "127.0.0.1",
            "--port", "5100",
            "--root-path", "/services/bokeh",
            "--ws-ping-interval", "1",
            "--ws-ping-timeout", "2",
            "--ws-max-size", str(20 * 1024 * 1024),
        ], stdout=log, stderr=subprocess.STDOUT)
        try:
            _wait_for_http("http://127.0.0.1:5100/", process)
            yield
        finally:
            _stop_process(process)


@pytest.fixture(scope="module")
def asgi_proxy(asgi_backend: None) -> Iterator[None]:
    assert PROXY_KIND is not None
    docker = shutil.which("docker")
    if docker is None:
        raise RuntimeError("docker is required for the nightly ASGI proxy test")

    artifact_dir = REPO_ROOT / "work" / "asgi-proxy" / PROXY_KIND
    name = f"bokeh-asgi-{PROXY_KIND}-{os.getpid()}"
    if PROXY_KIND == "nginx":
        image = "nginx:stable-alpine"
        config = CONFIG_ROOT / "nginx.conf"
        command = [
            docker, "run", "--detach", "--pull", "always", "--network", "host",
            "--name", name,
            "--volume", f"{config}:/etc/nginx/conf.d/default.conf:ro",
            image,
        ]
    else:
        image = "httpd:2.4-alpine"
        config = CONFIG_ROOT / "apache.conf"
        command = [
            docker, "run", "--detach", "--pull", "always", "--network", "host",
            "--name", name,
            "--volume", f"{config}:/usr/local/apache2/conf/extra/bokeh-proxy.conf:ro",
            image,
            "sh", "-euc", (
                "sed -i "
                "-e 's/^#LoadModule proxy_module /LoadModule proxy_module /' "
                "-e 's/^#LoadModule proxy_http_module /LoadModule proxy_http_module /' "
                "-e 's/^#LoadModule proxy_wstunnel_module /LoadModule proxy_wstunnel_module /' "
                "conf/httpd.conf && "
                "printf '\\nInclude conf/extra/bokeh-proxy.conf\\n' >> conf/httpd.conf && "
                "exec httpd-foreground"
            ),
        ]

    started = False
    try:
        result = subprocess.run(command, capture_output=True)
        (artifact_dir / "docker-start.log").write_bytes(result.stdout + result.stderr)
        result.check_returncode()
        started = True
        _wait_for_http(PUBLIC_URL)
        yield
    finally:
        if started:
            with (artifact_dir / "proxy.log").open("wb") as log:
                subprocess.run([docker, "logs", name], stdout=log, stderr=subprocess.STDOUT, check=False)
            subprocess.run([docker, "rm", "--force", name], check=False, capture_output=True)


def test_asgi_application_through_reverse_proxy(asgi_proxy: None) -> None:
    with playwright.sync_playwright() as manager:
        browser = manager.chromium.launch()
        try:
            page = browser.new_page()
            response = page.goto(PUBLIC_URL, wait_until="domcontentloaded")
            assert response is not None
            assert response.ok

            marker = page.locator("#proxy-request")
            marker.wait_for(state="visible", timeout=15_000)
            assert marker.text_content() == "ASGI reverse proxy ready"
            assert marker.get_attribute("data-host") == "127.0.0.1:8080"
            assert marker.get_attribute("data-root-path") == "/services/bokeh"
            assert page.evaluate("Bokeh.documents.length") == 1

            # No application messages cross the websocket while idle, so the
            # ASGI server's ping frames must keep it open past the proxy timeout.
            page.wait_for_timeout(7_000)
            page.get_by_role("button", name="Check connection").click()
            playwright.expect(marker).to_have_attribute("data-clicks", "1", timeout=5_000)
        finally:
            browser.close()
