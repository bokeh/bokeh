#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc. and contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import os
import re
import subprocess
import sys
from collections.abc import Iterator
from contextlib import ExitStack, contextmanager
from typing import Any
from urllib.parse import urlparse

# External imports
import pytest

# Bokeh imports
from tests.integration.server_e2e import test_examples as shared
from tests.integration.server_e2e.test_examples import (
    APP_ROOT,
    ARTIFACT_ROOT,
    REPO_ROOT,
    _page_errors,
    _stop_process,
    _unused_port,
    _wait_for_http,
    playwright,
)

browser = shared.browser

pytestmark = pytest.mark.skipif(
    os.environ.get("BOKEH_SERVER_E2E") != "1",
    reason="requires built BokehJS, React example dependencies, and an explicit server E2E run",
)


@contextmanager
def _running_react_app(transport: str, page: str = "live.html") -> Iterator[str]:
    backend_port, frontend_port = _unused_port(), _unused_port()
    while frontend_port == backend_port:
        frontend_port = _unused_port()
    backend_url = f"http://127.0.0.1:{backend_port}"
    frontend_url = f"http://127.0.0.1:{frontend_port}"
    environment = {
        **os.environ,
        "BOKEH_REACT_ORIGIN": f"127.0.0.1:{frontend_port}",
        "BOKEH_SESSION_BACKEND": backend_url,
    }
    artifact_dir = ARTIFACT_ROOT / "react-mount" / transport
    if page != "live.html":
        artifact_dir /= page.removesuffix(".html")
    artifact_dir.mkdir(parents=True, exist_ok=True)
    if transport == "uvicorn":
        server_command = [
            sys.executable, "-m", "uvicorn", "react_mount:app",
            "--host", "127.0.0.1", "--port", str(backend_port),
        ]
    else:
        server_command = [sys.executable, "react_mount.py", "--tornado", "--port", str(backend_port)]
    client_root = REPO_ROOT / "bokehjs/examples/frameworks/react-vite"
    client_command = [
        "node", str(REPO_ROOT / "bokehjs/node_modules/vite/bin/vite.js"),
        "--host", "127.0.0.1", "--port", str(frontend_port),
    ]

    with ExitStack() as cleanup:
        server_log = cleanup.enter_context((artifact_dir / "server.log").open("wb"))
        server = subprocess.Popen(server_command, cwd=APP_ROOT, env=environment, stdout=server_log, stderr=subprocess.STDOUT)
        cleanup.callback(_stop_process, server)
        backend_path = "/bkapp" if page == "server.html" else "/session"
        _wait_for_http(f"{backend_url}{backend_path}", server)

        client_log = cleanup.enter_context((artifact_dir / "client.log").open("wb"))
        client = subprocess.Popen(client_command, cwd=client_root, env=environment, stdout=client_log, stderr=subprocess.STDOUT)
        cleanup.callback(_stop_process, client)
        _wait_for_http(f"{frontend_url}/{page}", client)
        yield f"{frontend_url}/{page}"


def _set_client_value(page: Any, value: int) -> None:
    control = page.get_by_test_id("client-value")
    control.press("Home")
    for _ in range(value):
        control.press("ArrowRight")
    playwright.expect(control).to_have_value(str(value))
    playwright.expect(page.get_by_test_id("session-status")).to_have_text(re.compile(rf"Server tick: \d+; amplitude: {value}"))


@pytest.mark.parametrize("transport", ["uvicorn", "tornado"])
def test_live_react_mount_ownership_and_dynamic_roots(browser: Any, transport: str) -> None:
    with _running_react_app(transport) as url:
        page = browser.new_page(viewport={"width": 1280, "height": 1100})
        errors = _page_errors(page)
        sockets: list[Any] = []
        page.on("websocket", lambda socket: sockets.append(socket) if "/bkapp/ws" in socket.url else None)
        try:
            response = page.goto(url, wait_until="domcontentloaded")
            assert response is not None and response.ok
            playwright.expect(page.get_by_test_id("root-count")).to_have_text("Document roots: 3", timeout=30_000)
            playwright.expect(page.get_by_test_id("toggle-plot")).to_be_enabled(timeout=30_000)
            controls = page.get_by_test_id("controls-host")
            original = controls.evaluate_handle("""host => {
                const mount = host.bokehMount
                const root = mount.document.get_model_by_name('controls')
                return {mount, view: mount.view(root.id), node: host.firstElementChild}
            }""")
            assert original.evaluate("saved => saved.view != null && saved.node != null")

            _set_client_value(page, 7)
            playwright.expect(page.get_by_test_id("root-count")).to_have_text("Document roots: 4")
            page.wait_for_function("() => document.querySelector('[data-testid=extra-host]').bokehMount != null")
            page.screenshot(path=str(ARTIFACT_ROOT / "react-mount" / transport / "live.png"), full_page=True)
            _set_client_value(page, 2)
            playwright.expect(page.get_by_test_id("root-count")).to_have_text("Document roots: 3")
            page.wait_for_function("""() => {
                const host = document.querySelector('[data-testid=extra-host]')
                return host.bokehMount == null && host.childElementCount === 0
            }""")
            _set_client_value(page, 7)
            page.wait_for_function("() => document.querySelector('[data-testid=extra-host]').bokehMount != null")

            page.get_by_test_id("toggle-plot").click()
            page.wait_for_function("() => document.querySelector('[data-testid=plot-host]').childElementCount === 0")
            previous = page.get_by_test_id("session-status").inner_text()
            page.wait_for_function("text => document.querySelector('[data-testid=session-status]').textContent !== text", arg=previous)
            assert controls.evaluate("""(host, saved) =>
                host.bokehMount === saved.mount && host.firstElementChild === saved.node &&
                host.bokehMount.view(saved.view.model.id) === saved.view
            """, original)

            page.get_by_test_id("toggle-plot").click()
            playwright.expect(page.get_by_test_id("toggle-plot")).to_be_enabled()
            page.wait_for_function("() => document.querySelector('[data-testid=plot-host]').bokehMount != null")
            assert controls.evaluate("(host, saved) => host.bokehMount.view(saved.view.model.id) === saved.view", original)

            page.get_by_test_id("toggle-views").click()
            playwright.expect(controls).to_have_count(0)
            assert original.evaluate("async ({mount}) => { await mount.when_disposed; return mount.views.length }") == 0
            assert original.evaluate("({mount}) => !mount.document.is_destroyed")
            previous = page.get_by_test_id("session-status").inner_text()
            page.wait_for_function("text => document.querySelector('[data-testid=session-status]').textContent !== text", arg=previous)
            assert len([socket for socket in sockets if not socket.is_closed()]) == 1

            _set_client_value(page, 2)
            playwright.expect(page.get_by_test_id("root-count")).to_have_text("Document roots: 3")
            _set_client_value(page, 7)
            playwright.expect(page.get_by_test_id("root-count")).to_have_text("Document roots: 4")
            page.get_by_test_id("toggle-views").click()
            playwright.expect(page.get_by_test_id("toggle-plot")).to_be_enabled()
            page.wait_for_function("() => document.querySelector('[data-testid=extra-host]').bokehMount != null")
            assert controls.evaluate("""(host, saved) =>
                host.bokehMount !== saved.mount && host.bokehMount.document === saved.mount.document &&
                host.bokehMount.views.length === 4
            """, original)

            active = [socket for socket in sockets if not socket.is_closed()]
            assert len(active) == 1
            with active[0].expect_event("close", timeout=10_000):
                page.get_by_test_id("toggle-session").click()
            playwright.expect(page.get_by_role("status")).to_have_text("Disconnected. The owning scope has closed the connection.")
            playwright.expect(page.get_by_test_id("controls-host")).to_have_count(0)
            assert all(socket.is_closed() for socket in sockets)
            assert original.evaluate("({mount}) => mount.document.is_destroyed && mount.document.views_manager == null")
            assert errors == []
        finally:
            page.close()


@pytest.mark.parametrize("transport", ["uvicorn", "tornado"])
def test_server_document_url_mount_and_owned_cleanup(browser: Any, transport: str) -> None:
    with _running_react_app(transport, "server.html") as url:
        page = browser.new_page(viewport={"width": 1100, "height": 1000})
        errors = _page_errors(page)
        sockets: list[Any] = []
        requests: list[str] = []
        page.on("websocket", lambda socket: sockets.append(socket) if "/bkapp/ws" in socket.url else None)
        page.on("request", lambda request: requests.append(urlparse(request.url).path))
        try:
            with page.expect_response(lambda response: urlparse(response.url).path == "/bkapp/embed.json") as bootstrap:
                response = page.goto(url, wait_until="domcontentloaded")
            assert response is not None and response.ok
            assert bootstrap.value.ok
            playwright.expect(page.get_by_role("status")).to_have_text(
                "Connected. The plot and controls are synchronized with Python.", timeout=30_000,
            )
            assert "/session" not in requests

            target = page.locator("#plot")
            original = target.evaluate_handle("host => host.bokehMount")
            assert original.evaluate("mount => mount.session.document === mount.document && mount.views.length === 3")
            session_id = original.evaluate("mount => mount.session.id")
            status = target.get_by_text(re.compile(r"^Server tick: \d+; amplitude: 2$"))
            playwright.expect(status).to_have_count(1)
            previous = status.inner_text()
            playwright.expect(status).not_to_have_text(previous)

            slider = target.get_by_role("slider")
            slider.press("Home")
            for _ in range(7):
                slider.press("ArrowRight")
            playwright.expect(target.get_by_text(re.compile(r"^Server tick: \d+; amplitude: 7$"))).to_have_count(1)
            page.wait_for_function("""() => {
                const mount = document.querySelector('#plot').bokehMount
                const extra = mount.document.get_model_by_name('extra')
                return extra != null && mount.view(extra.id) != null && mount.views.length === 4
            }""")
            playwright.expect(target.get_by_text(re.compile(r"^Python added this root\. Server tick: \d+$"))).to_have_count(1)
            page.screenshot(path=str(ARTIFACT_ROOT / "react-mount" / transport / "server" / "server.png"), full_page=True)

            slider.press("Home")
            for _ in range(2):
                slider.press("ArrowRight")
            playwright.expect(status).to_have_count(1)
            page.wait_for_function("""() => {
                const mount = document.querySelector('#plot').bokehMount
                return mount.document.roots().length === 3 && mount.views.length === 3
            }""")
            playwright.expect(target.get_by_text(re.compile(r"^Python added this root\.")).first).to_have_count(0)

            active = [socket for socket in sockets if not socket.is_closed()]
            assert len(active) == 1
            with active[0].expect_event("close", timeout=10_000):
                page.get_by_role("button", name="Disconnect", exact=True).click()
            playwright.expect(page.get_by_role("status")).to_have_text(
                "Disconnected. The views, connection, and client document have been released.",
            )
            assert original.evaluate("async mount => { await mount.when_disposed; return mount.document.is_destroyed }")
            assert original.evaluate("mount => mount.views.length === 0 && mount.document.views_manager == null")
            assert target.evaluate("host => host.childElementCount === 0 && host.bokehMount == null")
            assert all(socket.is_closed() for socket in sockets)

            page.get_by_role("button", name="Connect a new session").click()
            playwright.expect(page.get_by_role("button", name="Disconnect", exact=True)).to_be_enabled(timeout=30_000)
            assert target.evaluate("(host, previous) => host.bokehMount.session.id !== previous", session_id)
            assert requests.count("/bkapp/embed.json") == 2
            assert "/session" not in requests
            assert errors == []
        finally:
            page.close()
