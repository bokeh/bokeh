#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import os
import socket
import subprocess
import sys
import time
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import urlopen

# External imports
import pytest

playwright = pytest.importorskip("playwright.sync_api")


pytestmark = pytest.mark.skipif(
    os.environ.get("BOKEH_SERVER_E2E") != "1",
    reason="requires the nightly Bokeh server E2E job or an explicit local run",
)

HERE = Path(__file__).parent
REPO_ROOT = HERE.parents[2]
APP_ROOT = REPO_ROOT / "examples" / "server" / "api" / "asgi"
ARTIFACT_ROOT = REPO_ROOT / "work" / "server-e2e"
SERVER = os.environ.get("BOKEH_SERVER_E2E_RUNNER", "uvicorn")


@dataclass(frozen=True)
class FourierHost:
    target: str
    heading: str


FOURIER_HOSTS = [
    FourierHost("framework_free:application", "framework-free ASGI"),
    FourierHost("fastapi_embed:app", "FastAPI"),
    FourierHost("starlette_embed:app", "Starlette"),
    FourierHost("django_embed:application", "Django"),
]


def _unused_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def _wait_for_http(url: str, process: subprocess.Popen[bytes]) -> None:
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        if process.poll() is not None:
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


@contextmanager
def _running_app(target: str) -> Iterator[str]:
    port = _unused_port()
    url = f"http://127.0.0.1:{port}/"
    artifact_dir = ARTIFACT_ROOT / SERVER / target.split(":", maxsplit=1)[0].replace(".", "-")
    artifact_dir.mkdir(parents=True, exist_ok=True)
    if SERVER == "uvicorn":
        command = [
            sys.executable, "-m", "uvicorn", target,
            "--app-dir", str(APP_ROOT),
            "--host", "127.0.0.1",
            "--port", str(port),
            "--ws-max-size", str(20 * 1024 * 1024),
        ]
    elif SERVER == "hypercorn":
        command = [
            sys.executable, "-m", "hypercorn", target,
            "--bind", f"127.0.0.1:{port}",
        ]
    else:
        raise ValueError(f"Unsupported ASGI server {SERVER!r}")

    with (artifact_dir / "server.log").open("wb") as log:
        process = subprocess.Popen(command, cwd=APP_ROOT, stdout=log, stderr=subprocess.STDOUT)
        try:
            _wait_for_http(url, process)
            yield url
        finally:
            _stop_process(process)


@pytest.fixture(scope="module")
def browser() -> Iterator[Any]:
    with playwright.sync_playwright() as manager:
        browser = manager.chromium.launch()
        try:
            yield browser
        finally:
            browser.close()


def _page_errors(page: Any) -> list[str]:
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    return errors


def _wait_for_document(target: Any) -> None:
    target.wait_for_function(
        "() => globalThis.Bokeh != null && Bokeh.documents.length === 1",
        timeout=30_000,
    )


def _set_fourier_terms(target: Any, terms: int) -> None:
    target.evaluate(
        "terms => { Bokeh.documents[0].get_model_by_name('terms').value = terms }",
        terms,
    )
    target.wait_for_function(
        "terms => Bokeh.documents[0].get_model_by_name('spectrum-source').data.harmonic.length === terms",
        arg=terms,
        timeout=10_000,
    )


def _wait_for_bokeh_frame(page: Any) -> Any:
    iframe = page.locator('iframe[src*="/bkapp/"]')
    iframe.wait_for(timeout=30_000)
    handle = iframe.element_handle()
    assert handle is not None
    frame = handle.content_frame()
    assert frame is not None
    _wait_for_document(frame)
    return frame


@pytest.mark.parametrize("host", FOURIER_HOSTS, ids=lambda host: host.heading)
def test_fourier_hosts_run_with_live_python_callbacks(browser: Any, host: FourierHost) -> None:
    with _running_app(host.target) as url:
        page = browser.new_page()
        errors = _page_errors(page)
        try:
            response = page.goto(url, wait_until="domcontentloaded")
            assert response is not None
            assert response.ok
            assert host.heading in page.locator("h1").inner_text()
            _wait_for_document(page)
            _set_fourier_terms(page, 3)
            assert errors == []
        finally:
            page.close()


def test_fastapi_shared_data_streams_to_independent_sessions(browser: Any) -> None:
    with _running_app("fastapi_shared_data:app") as url:
        pages = [browser.new_page(), browser.new_page()]
        errors = [_page_errors(page) for page in pages]
        try:
            initial: list[str] = []
            for page in pages:
                response = page.goto(url, wait_until="domcontentloaded")
                assert response is not None
                assert response.ok
                _wait_for_document(page)
                initial.append(page.evaluate("Bokeh.documents[0].get_model_by_name('shared-phase').text"))

            for page, text in zip(pages, initial):
                page.wait_for_function(
                    "text => Bokeh.documents[0].get_model_by_name('shared-phase').text !== text",
                    arg=text,
                    timeout=10_000,
                )
            assert errors == [[], []]
        finally:
            for page in pages:
                page.close()


def test_streamlit_simple_runs_bokeh_callbacks_in_its_iframe(browser: Any) -> None:
    with _running_app("streamlit_simple:app") as url:
        page = browser.new_page()
        errors = _page_errors(page)
        try:
            response = page.goto(url, wait_until="domcontentloaded")
            assert response is not None
            assert response.ok
            page.get_by_role("heading", name="Bokeh Fourier studio").wait_for(timeout=30_000)
            frame = _wait_for_bokeh_frame(page)
            _set_fourier_terms(frame, 4)
            assert errors == []
        finally:
            page.close()


def test_streamlit_particle_viewers_animate_and_keep_independent_state(browser: Any) -> None:
    with _running_app("streamlit_particles.app:app") as url:
        contexts = [browser.new_context(), browser.new_context()]
        pages = [context.new_page() for context in contexts]
        errors = [_page_errors(page) for page in pages]
        try:
            frames = []
            for page in pages:
                response = page.goto(url, wait_until="domcontentloaded")
                assert response is not None
                assert response.ok
                page.get_by_role("heading", name="Streamlit-controlled particle simulation").wait_for(timeout=30_000)
                frames.append(_wait_for_bokeh_frame(page))

            viewers = [parse_qs(urlparse(frame.url).query)["viewer"][0] for frame in frames]
            assert viewers[0] != viewers[1]
            assert all(
                frame.evaluate("Bokeh.documents[0].get_model_by_name('particles').data.x.length") == 50_000
                for frame in frames
            )

            particle_x = frames[0].evaluate(
                "Number(Bokeh.documents[0].get_model_by_name('particles').data.x[12345])",
            )
            frames[0].wait_for_function(
                "x => Number(Bokeh.documents[0].get_model_by_name('particles').data.x[12345]) !== x",
                arg=particle_x,
                timeout=10_000,
            )

            pages[0].get_by_role("button", name="Vortex flow", exact=True).click()
            pages[0].get_by_role("button", name="Binary gravity", exact=True).click()
            frames[0].wait_for_function(
                "() => Bokeh.documents[0].get_model_by_name('status').text.includes('Binary softened-gravity field')",
                timeout=10_000,
            )
            assert "Counter-rotating vortex flow" in frames[1].evaluate(
                "Bokeh.documents[0].get_model_by_name('status').text",
            )
            assert errors == [[], []]
        finally:
            for context in contexts:
                context.close()
