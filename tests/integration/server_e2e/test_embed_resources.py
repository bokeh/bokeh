#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import os
from urllib.parse import urlsplit

# External imports
import pytest
from tornado.web import RequestHandler

# Bokeh imports
from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.core.properties import Any as AnyProperty, Instance
from bokeh.document import Document
from bokeh.embed import embed_server
from bokeh.model import DataModel, Model
from bokeh.models import CustomJS, Div
from bokeh.util.compiler import TypeScript
from tests.support.plugins.managed_server_loop import MSL

playwright = pytest.importorskip("playwright.async_api")

pytestmark = pytest.mark.skipif(
    os.environ.get("BOKEH_SERVER_E2E") != "1",
    reason="requires the nightly Bokeh server E2E job or an explicit local run",
)


@pytest.mark.parametrize("mode", ["inline", "offline"])
@pytest.mark.parametrize("source", ["global-definition", "plain-any-callback"])
async def test_restrictive_server_resources_cover_serialized_models(
    ManagedServerLoop: MSL, mode: str, source: str,
) -> None:
    class Hidden(CustomJS):
        __view_model__ = "Hidden"
        __implementation__ = TypeScript('''
import {CustomJS} from "models/callbacks/customjs"

Object.assign(globalThis, {__bokeh_hidden_server_resource__: true})

export class Hidden extends CustomJS {}
''')

    if source == "global-definition":
        class UnusedDefinition(DataModel):
            __javascript__ = []
            child = Instance(CustomJS, default=Hidden(code=""))
    else:
        class CallbackContainer(CustomJS):
            __view_model__ = "CallbackContainer"
            __implementation__ = TypeScript('''
import {CustomJS} from "models/callbacks/customjs"

export class CallbackContainer extends CustomJS {
  static {
    this.define<any>(({Any}) => ({child: [Any, null]}))
  }

  override initialize(): void {
    super.initialize()
    const child = (this as any).child
    Object.assign(globalThis, {__bokeh_plain_any_type__: child.nested[0].type})
  }
}
''')
            child = AnyProperty(default=None)

    def modify_document(document: Document) -> None:
        marker = Div(name="ready-marker", text="Server extension mount ready")
        document.add_root(marker)

        def respond_to_browser(attr: str, old: str, new: str) -> None:
            if new == "browser-request":
                marker.text = "Live server callback received"

        marker.on_change("text", respond_to_browser)
        if source == "plain-any-callback":
            document.js_on_event("document_ready", CallbackContainer(
                child={"nested": [Hidden(code="")]},
                code="",
                module=False,
            ))

    host_html = ""

    class HostHandler(RequestHandler):
        def get(self) -> None:
            self.set_header("Content-Type", "text/html")
            self.write(host_html)

    try:
        with ManagedServerLoop(
            {"/app": Application(FunctionHandler(modify_document))},
            address="127.0.0.1",
            extra_patterns=[(r"/host", HostHandler)],
        ) as server:
            origin = f"http://localhost:{server.port}"
            fragment = embed_server(f"{origin}/app").fragment(resources=mode)
            assert fragment.requirements.extensions == ()
            assert "__bokeh_hidden_server_resource__" not in fragment.html
            host_html = f"<!doctype html><html><body>{fragment.html}</body></html>"

            async with playwright.async_playwright() as manager:
                browser = await manager.chromium.launch()
                page = await browser.new_page()
                errors: list[str] = []
                websocket_urls: list[str] = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.on("websocket", lambda socket: websocket_urls.append(socket.url))
                try:
                    async with page.expect_response(
                        lambda response: urlsplit(response.url).path == "/app/embed.json",
                        timeout=30_000,
                    ) as bootstrap_response:
                        response = await page.goto(f"{origin}/host", wait_until="domcontentloaded")
                    assert response is not None and response.ok
                    bootstrap = await bootstrap_response.value
                    assert bootstrap.ok
                    payload = await bootstrap.json()

                    await page.wait_for_function(
                        """() => {
  const target = document.querySelector('[data-bokeh-root]')
  return target?.bokehMount != null || target?.bokehMountError != null
}""",
                        timeout=30_000,
                    )
                    assert await page.evaluate(
                        "() => document.querySelector('[data-bokeh-root]').bokehMountError?.message ?? null",
                    ) is None, errors
                    await page.evaluate("() => document.querySelector('[data-bokeh-root]').bokehMount.ready")
                    assert await page.evaluate(
                        "() => document.querySelector('[data-bokeh-root]').bokehMount.state",
                    ) == "ready"
                    await page.get_by_text("Server extension mount ready", exact=True).wait_for(state="visible")
                    assert any(
                        "__bokeh_hidden_server_resource__" in asset.get("content", "")
                        for asset in payload["resources"]["assets"]
                    )
                    assert await page.evaluate("globalThis.__bokeh_hidden_server_resource__ === true")
                    assert any(urlsplit(url).path == "/app/ws" for url in websocket_urls)
                    assert server.get_sessions("/app")[0].connection_count == 1

                    if source == "global-definition":
                        decoded = await page.evaluate('''([definition_name, hidden_name]) => {
  const document = Bokeh.documents[0]
  const Definition = document.resolver.get(definition_name)
  return Definition != null && Definition.create().child.type === hidden_name
}''', [UnusedDefinition.__qualified_model__, Hidden.__qualified_model__])
                        assert decoded
                    else:
                        await page.wait_for_function(
                            "hidden_name => globalThis.__bokeh_plain_any_type__ === hidden_name",
                            arg=Hidden.__qualified_model__,
                        )

                    await page.evaluate('''() => {
  Bokeh.documents[0].get_model_by_name("ready-marker").text = "browser-request"
}''')
                    await page.get_by_text("Live server callback received", exact=True).wait_for(state="visible")
                    assert errors == []
                finally:
                    await browser.close()
    finally:
        Model.clear_extensions()
