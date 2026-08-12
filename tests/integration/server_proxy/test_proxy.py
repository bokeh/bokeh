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


FRONTEND = os.environ.get("BOKEH_SERVER_FRONTEND")
PROXY_KIND = os.environ.get("BOKEH_SERVER_PROXY")
LOCAL_DOCKER = os.environ.get("BOKEH_SERVER_PROXY_LOCAL") == "1"
pytestmark = pytest.mark.skipif(
    FRONTEND not in {"asgi", "tornado"} or PROXY_KIND not in {"nginx", "apache"}
    or (sys.platform != "linux" and not LOCAL_DOCKER),
    reason="requires the Linux nightly Bokeh proxy job or an explicit local Docker run",
)

HERE = Path(__file__).parent
REPO_ROOT = HERE.parents[2]
CONFIG_ROOT = REPO_ROOT / "examples" / "server" / "deployment"
PUBLIC_PATH = "/services/bokeh/" if FRONTEND == "asgi" else "/services/bokeh/myapp"
PUBLIC_URL = f"http://127.0.0.1:8080{PUBLIC_PATH}"
BACKEND_URL = f"http://127.0.0.1:5100/services/bokeh/{'' if FRONTEND == 'asgi' else 'myapp'}"


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
def bokeh_backend() -> Iterator[None]:
    assert FRONTEND is not None
    assert PROXY_KIND is not None
    artifact_dir = REPO_ROOT / "work" / "server-proxy" / FRONTEND / PROXY_KIND
    artifact_dir.mkdir(parents=True, exist_ok=True)
    if FRONTEND == "asgi":
        command = [
            sys.executable, "-m", "uvicorn",
            "asgi_app:application",
            "--app-dir", str(HERE),
            "--host", "127.0.0.1",
            "--port", "5100",
            "--ws-ping-interval", "1",
            "--ws-ping-timeout", "2",
            "--ws-max-size", str(20 * 1024 * 1024),
        ]
    else:
        command = [
            sys.executable, "-m", "bokeh", "serve", str(HERE / "myapp.py"),
            "--port", "5100",
            "--prefix", "/services/bokeh",
            "--allow-websocket-origin", "127.0.0.1:8080",
            "--keep-alive", "1000",
        ]

    with (artifact_dir / "backend.log").open("wb") as log:
        process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT)
        try:
            _wait_for_http(BACKEND_URL, process)
            yield
        finally:
            _stop_process(process)


@pytest.fixture(scope="module")
def reverse_proxy(bokeh_backend: None) -> Iterator[None]:
    assert FRONTEND is not None
    assert PROXY_KIND is not None
    docker = shutil.which("docker")
    if docker is None:
        raise RuntimeError("docker is required for the nightly Bokeh proxy test")

    artifact_dir = REPO_ROOT / "work" / "server-proxy" / FRONTEND / PROXY_KIND
    name = f"bokeh-{FRONTEND}-{PROXY_KIND}-{os.getpid()}"
    config_root = CONFIG_ROOT / FRONTEND
    local_docker = LOCAL_DOCKER and sys.platform != "linux"
    network_args = ["--publish", "8080:8080"] if local_docker else ["--network", "host"]
    backend_host = "host.docker.internal" if local_docker else "127.0.0.1"
    if PROXY_KIND == "nginx":
        image = "nginx:stable-alpine"
        config = CONFIG_ROOT / "nginx.conf"
        command = [
            docker, "run", "--detach", "--pull", "always", *network_args,
            "--name", name,
            "--volume", f"{config}:/tmp/bokeh-proxy.conf:ro",
            image,
            "sh", "-euc", (
                f"sed 's/127\\.0\\.0\\.1:5100/{backend_host}:5100/g' /tmp/bokeh-proxy.conf | "
                "awk '{ if ($0 ~ /proxy_buffering off;/) { "
                "print \"        proxy_read_timeout 3s;\"; "
                "print \"        proxy_send_timeout 3s;\" } print }' "
                "> /etc/nginx/conf.d/default.conf && "
                "exec nginx -g 'daemon off;'"
            ),
        ]
    else:
        image = "httpd:2.4-alpine"
        config = config_root / "apache.conf"
        command = [
            docker, "run", "--detach", "--pull", "always", *network_args,
            "--name", name,
            "--volume", f"{config}:/tmp/bokeh-proxy.conf:ro",
            image,
            "sh", "-euc", (
                "sed -i "
                "-e 's/^#LoadModule proxy_module /LoadModule proxy_module /' "
                "-e 's/^#LoadModule proxy_http_module /LoadModule proxy_http_module /' "
                "-e 's/^#LoadModule proxy_wstunnel_module /LoadModule proxy_wstunnel_module /' "
                "conf/httpd.conf && "
                f"sed 's/127\\.0\\.0\\.1:5100/{backend_host}:5100/g' "
                "/tmp/bokeh-proxy.conf > conf/extra/bokeh-proxy.conf && "
                "printf '\\nProxyTimeout 3\\nInclude conf/extra/bokeh-proxy.conf\\n' >> conf/httpd.conf && "
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


def test_bokeh_application_through_reverse_proxy(reverse_proxy: None) -> None:
    assert FRONTEND is not None
    with playwright.sync_playwright() as manager:
        browser = manager.chromium.launch()
        try:
            page = browser.new_page()
            response = page.goto(PUBLIC_URL, wait_until="domcontentloaded")
            assert response is not None
            assert response.ok

            marker = page.locator("#proxy-request")
            marker.wait_for(state="visible", timeout=15_000)
            assert marker.text_content() == "Bokeh reverse proxy ready"
            assert marker.get_attribute("data-host") == "127.0.0.1:8080"
            assert marker.get_attribute("data-root-path") == ""
            assert page.evaluate("Bokeh.documents.length") == 1

            # No application messages cross the websocket while idle, so the
            # backend's keepalive traffic must keep it open past the proxy timeout.
            page.wait_for_timeout(7_000)
            page.get_by_role("button", name="Check connection").click()
            playwright.expect(marker).to_have_attribute("data-clicks", "1", timeout=5_000)
        finally:
            browser.close()
