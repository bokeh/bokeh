#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

# Standard library imports
import importlib.util
import os
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

# External imports
import pytest


pytestmark = pytest.mark.skipif(
    shutil.which("marimo") is None or importlib.util.find_spec("anywidget") is None,
    reason="marimo and AnyWidget 0.11 or later are required",
)


def _unused_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def _wait_for_server(url: str, process: subprocess.Popen[str]) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            output = process.stdout.read() if process.stdout is not None else ""
            raise AssertionError(f"marimo exited before startup:\n{output}")
        try:
            with urlopen(url, timeout=1):
                return
        except Exception:
            time.sleep(0.1)
    raise AssertionError("marimo did not start within 30 seconds")


def test_marimo_renders_static_and_connected_anywidget_views() -> None:
    playwright = pytest.importorskip("playwright.sync_api")
    root = Path(__file__).parents[2]
    example = root / "examples" / "output" / "marimo" / "bokeh_marimo.py"
    port = _unused_port()
    url = f"http://127.0.0.1:{port}/"
    env = os.environ.copy()
    source = str(root / "src")
    env["PYTHONPATH"] = source + (os.pathsep + env["PYTHONPATH"] if env.get("PYTHONPATH") else "")
    process = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "marimo",
            "run",
            str(example),
            "--headless",
            "--no-token",
            "--port",
            str(port),
        ],
        cwd=root,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    try:
        _wait_for_server(url, process)
        with playwright.sync_playwright() as manager:
            browser = manager.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url)
            page.locator("marimo-anywidget").nth(1).wait_for(state="attached", timeout=30_000)
            page.locator(".bk-Figure").nth(1).wait_for(state="attached", timeout=30_000)

            assert page.locator(".bk-notebook-diagnostic").count() == 0
            assert page.locator(".bk-notebook-disconnected").count() == 0
            assert page.locator("marimo-anywidget").count() == 2
            assert page.locator('[data-bokeh-anywidget-live="connected"]').count() == 1

            second_page = browser.new_page()
            second_page.goto(url)
            second_page.locator("marimo-anywidget").nth(1).wait_for(state="attached", timeout=30_000)
            second_page.locator(".bk-Figure").nth(1).wait_for(state="attached", timeout=30_000)

            assert second_page.locator(".bk-notebook-diagnostic").count() == 0
            assert second_page.locator(".bk-notebook-disconnected").count() == 0
            assert second_page.locator("marimo-anywidget").count() == 2
            assert second_page.locator('[data-bokeh-anywidget-live="connected"]').count() == 1

            slider = page.get_by_role("slider")
            assert slider.get_attribute("aria-valuenow") == "4"
            slider.press("ArrowLeft")
            page.wait_for_function(
                "Object.values(window.Bokeh.index).some((view) => "
                "view.model.document.get_model_by_name('marimo-live-source')?.data.x.length === 3)",
                timeout=10_000,
            )
            assert slider.get_attribute("aria-valuenow") == "3"
            slider.press("ArrowRight")
            slider.press("ArrowRight")
            slider.press("ArrowRight")
            page.wait_for_function(
                "Number(document.querySelector('marimo-anywidget')?.shadowRoot?"
                ".querySelector('[data-bokeh-anywidget-messages]')?"
                ".dataset.bokehAnywidgetMessages ?? 0) > 0",
                timeout=10_000,
            )
            page.wait_for_function(
                "Object.values(window.Bokeh.index).some((view) => "
                "view.model.document.get_model_by_name('marimo-live-source')?.data.x.length === 6)",
                timeout=10_000,
            )
            assert slider.get_attribute("aria-valuenow") == "6"
            assert page.locator('[data-bokeh-anywidget-live="connected"]').count() == 1
            browser.close()
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=10)
        if process.stdout is not None:
            process.stdout.close()
