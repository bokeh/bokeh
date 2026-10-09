#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations # isort:skip

import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
import asyncio
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from typing import Any
from unittest.mock import MagicMock, PropertyMock, patch

# Bokeh imports
from bokeh.document.document import Document
from bokeh.embed.resources import ResourceRequirements
from bokeh.io.doc import patch_curdoc, set_curdoc
from bokeh.io.notebook import log
from bokeh.util.warnings import BokehDeprecationWarning

# Module under test
import bokeh.io.notebook as binb # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_install_notebook_hook() -> None:
    binb.install_notebook_hook("foo", "load", "doc", "app")
    assert binb._HOOKS["foo"]['load'] == "load"
    assert binb._HOOKS["foo"]['doc'] == "doc"
    assert binb._HOOKS["foo"]['app'] == "app"
    with pytest.raises(RuntimeError):
        binb.install_notebook_hook("foo", "load2", "doc2", "app2")
    binb.install_notebook_hook("foo", "load2", "doc2", "app2", overwrite=True)
    assert binb._HOOKS["foo"]['load'] == "load2"
    assert binb._HOOKS["foo"]['doc'] == "doc2"
    assert binb._HOOKS["foo"]['app'] == "app2"
    del binb._HOOKS["foo"]


def test_legacy_notebook_hooks_receive_unused_state(monkeypatch: pytest.MonkeyPatch) -> None:
    received = []

    def show_doc(obj: object, state: object, notebook_handle: bool) -> str:
        received.append((obj, state, notebook_handle))
        return "document"

    def show_app(app: object, state: object, notebook_url: str, **kwargs: object) -> str:
        received.append((app, state, notebook_url, kwargs))
        return "application"

    monkeypatch.setattr(binb, "_HOOKS", {})
    with pytest.warns(BokehDeprecationWarning, match="no longer receive output state"):
        binb.install_notebook_hook("jupyter", lambda *args: None, show_doc, show_app)

    assert binb.run_notebook_hook("jupyter", "doc", "plot", True) == "document"
    assert binb.run_notebook_hook("jupyter", "app", "app", "localhost:8888", port=1234) == "application"
    assert binb.run_notebook_hook("jupyter", "doc", obj="plot", notebook_handle=False) == "document"
    assert binb.run_notebook_hook("jupyter", "app", app="app", notebook_url="localhost:8888", port=4321) == "application"
    assert received == [
        ("plot", None, True), ("app", None, "localhost:8888", {"port": 1234}),
        ("plot", None, False), ("app", None, "localhost:8888", {"port": 4321}),
    ]


def test_legacy_notebook_hook_adaptation_is_idempotent() -> None:

    def show_doc(obj: object, state: object, notebook_handle: bool) -> tuple[object, object, bool]:
        return obj, state, notebook_handle

    with pytest.warns(BokehDeprecationWarning, match="no longer receive output state"):
        adapted = binb._adapt_notebook_hook(show_doc)
    assert binb._adapt_notebook_hook(adapted) is adapted
    assert adapted("plot", False) == ("plot", None, False)


@patch('bokeh.io.notebook.get_comms')
@patch('bokeh.io.notebook.publish_display_data')
@patch('bokeh.io.notebook._legacy_notebook_content')
def test_colab_hook_can_forward_unused_state(mock_notebook_content: MagicMock,
        mock_publish: MagicMock, mock_get_comms: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    from bokeh.models import Div

    obj = Div()
    document = Document()
    set_curdoc(document)
    mock_notebook_content.return_value = ["script", "div", document]

    def show_doc(obj: object, state: object, notebook_handle: bool) -> object:
        return binb.show_doc(obj, state, notebook_handle)  # type: ignore[arg-type]

    monkeypatch.setattr(binb, "_HOOKS", {})
    with pytest.warns(BokehDeprecationWarning, match="no longer receive output state"):
        binb.install_notebook_hook("jupyter", lambda *args: None, show_doc, lambda *args: None)

    assert binb.run_notebook_hook("jupyter", "doc", obj, False) is None
    mock_notebook_content.assert_called_once_with(obj, None)
    mock_get_comms.assert_not_called()
    assert mock_publish.call_count == 2


@patch('bokeh.server.server.Server')
@patch('bokeh.io.notebook.publish_display_data')
def test_show_app_publishes_single_shared_mount_script(mock_publish: MagicMock,
        mock_server: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    from bokeh.embed import embed_server

    monkeypatch.setattr(binb, "_NOTEBOOK_SERVERS", {})
    mock_server.return_value.port = 1234
    binb.show_app(lambda doc: None)

    data = mock_publish.call_args.args[0]
    html = data[binb.HTML_MIME_TYPE]
    assert html.startswith("<script>")
    assert html.count("<script") == html.count("</script>") == 1
    assert 'document.createElement("script")' in html
    assert "declaration.replaceWith(bootstrap)" in html
    assert "bootstrap.nonce = declaration.nonce" in html
    assert 'declaration.dataset.bokehResourceMode = "server"' in html
    match = re.search(r"container.innerHTML = (.+)\n", html)
    assert match is not None
    fragment = json.loads(match.group(1))
    assert 'data-bokeh-root="*"' in fragment
    assert 'type="application/vnd.bokeh.embed+json"' in fragment
    assert "Bokeh.mount_embed_declaration(declaration)" in fragment
    assert "data-bokeh-embed-instance=" in fragment
    assert "data-bokeh-embed=" not in fragment
    match = re.search(r'<script\b[^>]*\bdata-bokeh-embed-payload\b[^>]*>(.*?)</script>', fragment, re.DOTALL)
    assert match is not None
    payload = json.loads(match.group(1))
    assert payload["source"] == embed_server("http://localhost:1234/").source
    assert "fingerprint" not in payload
    assert binb.EXEC_MIME_TYPE in data
    assert "server_id" in mock_publish.call_args.kwargs["metadata"][binb.EXEC_MIME_TYPE]

@patch('bokeh.io.notebook.get_comms')
@patch('bokeh.io.notebook.publish_display_data')
@patch('bokeh.io.notebook._legacy_notebook_content')
def test_show_doc_no_server(mock_notebook_content: MagicMock,
                            mock__publish_display_data: MagicMock,
                            mock_get_comms: MagicMock) -> None:
    mock_get_comms.return_value = "comms"
    d = Document()
    set_curdoc(d)
    mock_notebook_content.return_value = ["notebook_script", "notebook_div", d]

    from bokeh.models import Div
    obj = Div()

    assert mock__publish_display_data.call_count == 0
    binb.show_doc(obj, True)

    expected_args = ({'application/javascript': 'notebook_script', 'application/vnd.bokehjs_exec.v0+json': ''},)
    expected_kwargs = {'metadata': {'application/vnd.bokehjs_exec.v0+json': {'id': obj.id}}}

    assert d.callbacks._hold is not None
    assert mock__publish_display_data.call_count == 2 # two mime types
    assert mock__publish_display_data.call_args[0] == expected_args
    assert mock__publish_display_data.call_args[1] == expected_kwargs

@patch('bokeh.io.notebook.get_comms')
@patch('bokeh.io.notebook.publish_display_data')
@patch('bokeh.io.notebook._legacy_notebook_content')
def test_show_doc_wraps_sequence_in_layout(mock_notebook_content: MagicMock,
                                           mock__publish_display_data: MagicMock,
                                           mock_get_comms: MagicMock) -> None:
    from bokeh.layouts import Column
    from bokeh.models import Div

    mock_get_comms.return_value = "comms"
    document = Document()
    set_curdoc(document)
    mock_notebook_content.return_value = ["notebook_script", "notebook_div", Document()]

    child_0, child_1 = Div(), Div()

    # A sequence of UIElements should not raise in notebook output mode (#14861);
    # it is wrapped in a single column layout root.
    binb.show_doc([child_0, child_1])

    roots = list(document.roots)
    assert len(roots) == 1
    assert isinstance(roots[0], Column)
    assert list(roots[0].children) == [child_0, child_1]


def test_legacy_notebook_content_adapts_protocol_result() -> None:
    from bokeh.core.types import ID
    from bokeh.plotting import figure

    plot = figure()
    script, div, cell_doc = binb._legacy_notebook_content(plot, ID("target"))

    assert "embed_items_notebook" in script
    assert '"notebook_comms_target":"target"' in script
    assert f'data-root-id="{plot.id}"' in div
    assert cell_doc is not None
    assert cell_doc.get_model_by_id(plot.id) is not None


@patch('bokeh.embed.result.EmbedResult.source', new_callable=PropertyMock)
@patch('bokeh.embed.result.EmbedResult.fragment')
def test_legacy_notebook_content_skips_unused_fragment_and_source_copy(
        mock_fragment: MagicMock, mock_source: PropertyMock) -> None:
    from bokeh.plotting import figure

    mock_fragment.side_effect = AssertionError("legacy notebook output does not use an embed fragment")
    mock_source.side_effect = AssertionError("legacy notebook output only reads the stored source")

    script, div, cell_doc = binb._legacy_notebook_content(figure(), None)

    assert "embed_items_notebook" in script
    assert "data-root-id" in div
    assert cell_doc is None
    mock_fragment.assert_not_called()
    mock_source.assert_not_called()


def test_legacy_notebook_content_preserves_current_theme_and_live_model_ids() -> None:
    from bokeh.core.types import ID
    from bokeh.models import Button
    from bokeh.themes import Theme

    current = Document(theme=Theme(json={"attrs": {"Button": {"button_type": "danger"}}}))
    source = Document(theme=Theme(json={"attrs": {"Button": {"button_type": "success"}}}))
    button = Button()
    source.add_root(button)

    with patch_curdoc(current):
        _, _, cell_doc = binb._legacy_notebook_content(button, ID("target"))

    assert cell_doc is not None
    copied = cell_doc.get_model_by_id(button.id)
    assert isinstance(copied, Button)
    assert copied.button_type == "danger"
    assert button.document is source
    assert button.button_type == "success"


@patch('bokeh.document.Document.from_json')
def test_legacy_notebook_content_without_handle_does_not_reconstruct_document(mock_from_json: MagicMock) -> None:
    from bokeh.plotting import figure

    script, div, cell_doc = binb._legacy_notebook_content(figure(), None)

    assert "embed_items_notebook" in script
    assert "data-root-id" in div
    assert cell_doc is None
    mock_from_json.assert_not_called()


class Test_push_notebook:
    @patch('bokeh.io.notebook.CommsHandle.comms', new_callable=PropertyMock)
    def test_no_events(self, mock_comms: PropertyMock) -> None:
        mock_comms.return_value = MagicMock()

        d = Document()

        handle = binb.CommsHandle("comms", d)
        binb.push_notebook(document=d, handle=handle)
        assert mock_comms.call_count == 0

    @patch('bokeh.io.notebook.CommsHandle.comms', new_callable=PropertyMock)
    def test_with_events(self, mock_comms: PropertyMock) -> None:
        mock_comm = MagicMock()
        mock_send = MagicMock(return_value="junk")
        mock_comm.send = mock_send
        mock_comms.return_value = mock_comm

        d = Document()

        handle = binb.CommsHandle("comms", d)
        d.title = "foo"
        binb.push_notebook(document=d, handle=handle)
        assert mock_comms.call_count > 0
        assert mock_send.call_count == 1
        envelope = json.loads(mock_send.call_args[0][0])
        assert envelope["content"] == {
            "events": [{"kind": "TitleChanged", "title": "foo"}],
        }
        assert envelope["buffers"] == []
        assert mock_send.call_args[1] == {}

    @patch('bokeh.io.notebook.CommsHandle.comms', new_callable=PropertyMock)
    def test_filters_non_patch_events(self, mock_comms: PropertyMock) -> None:
        mock_comm = MagicMock()
        mock_send = MagicMock(return_value="junk")
        mock_comm.send = mock_send
        mock_comms.return_value = mock_comm

        d = Document()
        handle = binb.CommsHandle("comms", d)

        d.add_next_tick_callback(lambda: None)
        d.title = "foo"
        binb.push_notebook(document=d, handle=handle)

        envelope = json.loads(mock_send.call_args[0][0])
        assert envelope["content"] == {
            "events": [{"kind": "TitleChanged", "title": "foo"}],
        }
        assert d.callbacks._held_events == []

    def test_implicit_handle_is_local_to_each_thread_context(self) -> None:
        barrier = Barrier(2)

        def push(title: str) -> MagicMock:
            comms = MagicMock()
            document = Document()
            handle = binb.CommsHandle(comms, document)
            binb._remember_comms_handle(handle)
            barrier.wait()
            document.title = title
            barrier.wait()
            binb.push_notebook(document=document)
            return comms

        with ThreadPoolExecutor(max_workers=2) as executor:
            first = executor.submit(push, "first")
            second = executor.submit(push, "second")
            first_comms = first.result()
            second_comms = second.result()

        first_envelope = json.loads(first_comms.send.call_args_list[0].args[0])
        second_envelope = json.loads(second_comms.send.call_args_list[0].args[0])
        assert first_envelope["content"]["events"] == [{"kind": "TitleChanged", "title": "first"}]
        assert second_envelope["content"]["events"] == [{"kind": "TitleChanged", "title": "second"}]

    def test_implicit_handle_survives_sequential_async_task_contexts(self) -> None:
        comms = MagicMock()
        document = Document()
        handle = binb.CommsHandle(comms, document)
        previous = getattr(binb._LAST_COMMS_HANDLE_BY_THREAD, "handle", None)
        binb._LAST_COMMS_HANDLE_BY_THREAD.handle = None

        async def run() -> None:
            async def remember() -> None:
                binb._remember_comms_handle(handle)

            async def push() -> None:
                binb.push_notebook(document=document)

            await asyncio.create_task(remember())
            document.title = "from another cell"
            await asyncio.create_task(push())

        try:
            asyncio.run(run())
        finally:
            binb._LAST_COMMS_HANDLE_BY_THREAD.handle = previous

        envelope = json.loads(comms.send.call_args_list[0].args[0])
        assert envelope["content"]["events"] == [{"kind": "TitleChanged", "title": "from another cell"}]

    def test_implicit_handle_supersedes_parent_context_in_later_async_task(self) -> None:
        parent_comms = MagicMock()
        parent_handle = binb.CommsHandle(parent_comms, Document())
        comms = MagicMock()
        document = Document()
        handle = binb.CommsHandle(comms, document)
        previous_handle = getattr(binb._LAST_COMMS_HANDLE_BY_THREAD, "handle", None)

        async def run() -> None:
            async def remember() -> None:
                binb._remember_comms_handle(handle)

            async def push() -> None:
                binb.push_notebook(document=document)

            await asyncio.create_task(remember())
            document.title = "from a later cell"
            await asyncio.create_task(push())

        try:
            binb._remember_comms_handle(parent_handle)
            asyncio.run(run())
        finally:
            binb._LAST_COMMS_HANDLE_BY_THREAD.handle = previous_handle

        assert parent_comms.send.call_count == 0
        envelope = json.loads(comms.send.call_args_list[0].args[0])
        assert envelope["content"]["events"] == [{"kind": "TitleChanged", "title": "from a later cell"}]

    def test_explicit_handles_remain_local_to_concurrent_async_tasks(self) -> None:
        handles = [
            binb.CommsHandle(MagicMock(), Document()),
            binb.CommsHandle(MagicMock(), Document()),
        ]
        async def run() -> None:
            first_configured = asyncio.Event()
            second_configured = asyncio.Event()

            async def first() -> None:
                handles[0].doc.title = "first"
                first_configured.set()
                await second_configured.wait()
                binb.push_notebook(document=handles[0].doc, handle=handles[0])

            async def second() -> None:
                await first_configured.wait()
                handles[1].doc.title = "second"
                second_configured.set()
                binb.push_notebook(document=handles[1].doc, handle=handles[1])

            await asyncio.gather(first(), second())

        asyncio.run(run())

        for handle, title in zip(handles, ("first", "second")):
            envelope = json.loads(handle.comms.send.call_args_list[0].args[0])
            assert envelope["content"]["events"] == [{"kind": "TitleChanged", "title": title}]


def test_load_notebook_only_resolves_builtin_components(monkeypatch: pytest.MonkeyPatch) -> None:
    from bokeh.model import Model
    from bokeh.models import CustomJS
    from bokeh.util.compiler import JavaScript

    class RegisteredCustomJS(CustomJS):
        __implementation__ = JavaScript("export const value = 1")

    def fail_if_bundled(models: Any) -> None:
        raise AssertionError("notebook startup must not compile registered extensions")

    published: list[dict[str, Any]] = []
    old_loaded = binb._NOTEBOOK_LOADED
    old_requirements = binb._NOTEBOOK_REQUIREMENTS

    monkeypatch.setattr(binb, "publish_display_data", lambda data, **kwargs: published.append(data))
    monkeypatch.setattr("bokeh.embed.resources.bundle_models", fail_if_bundled)
    try:
        binb.load_notebook(resources="none", hide_banner=True)
        requirements = binb._NOTEBOOK_REQUIREMENTS
    finally:
        binb._NOTEBOOK_LOADED = old_loaded
        binb._NOTEBOOK_REQUIREMENTS = old_requirements
        Model.clear_extensions()

    assert requirements == ResourceRequirements((
        "bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax",
    ))
    assert published[-1][binb.JS_MIME_TYPE]


def test_show_doc_loads_custom_model_registered_after_load_notebook(monkeypatch: pytest.MonkeyPatch) -> None:
    from bokeh.model import Model
    from bokeh.models import CustomJS
    from bokeh.util.compiler import JavaScript

    old_loaded = binb._NOTEBOOK_LOADED
    old_requirements = binb._NOTEBOOK_REQUIREMENTS
    binb._NOTEBOOK_LOADED = binb.Resources(mode="cdn")
    binb._NOTEBOOK_REQUIREMENTS = ResourceRequirements((
        "bokeh/core", "bokeh/widgets", "bokeh/tables", "bokeh/webgl", "bokeh/mathjax",
    ))
    monkeypatch.setattr("bokeh.embed.resources.bundle_models", lambda models: "compiled-late-custom-model")
    try:
        class LateCustomJS(CustomJS):
            __implementation__ = JavaScript("export const value = 1")

        script, _, _ = binb._legacy_notebook_content(LateCustomJS(code="return value"), None)
        repeated_script, _, _ = binb._legacy_notebook_content(LateCustomJS(code="return value"), None)
    finally:
        binb._NOTEBOOK_LOADED = old_loaded
        binb._NOTEBOOK_REQUIREMENTS = old_requirements
        Model.clear_extensions()

    assert "resource_loader.ensure" in script
    assert script.count("compiled-late-custom-model") == 1
    assert ".then(() => root.Bokeh.embed.embed_items_notebook" in script
    assert repeated_script.count("compiled-late-custom-model") == 1

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

def test__origin_url() -> None:
    assert binb._origin_url("foo.com:8888") == "foo.com:8888"
    assert binb._origin_url("http://foo.com:8888") == "foo.com:8888"
    assert binb._origin_url("https://foo.com:8888") == "foo.com:8888"

def test__server_url() -> None:
    assert binb._server_url("foo.com:8888", 10) == "http://foo.com:10/"
    assert binb._server_url("http://foo.com:8888", 10) == "http://foo.com:10/"
    assert binb._server_url("https://foo.com:8888", 10) == "https://foo.com:10/"


@patch.dict(os.environ, {"JUPYTER_BOKEH_EXTERNAL_URL": "https://our-hub.edu"})
@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/homer@donuts.edu/"})
def test__remote_jupyter_proxy_url_0() -> None:
    assert binb._remote_jupyter_proxy_url(1234) == "https://our-hub.edu/user/homer@donuts.edu/proxy/1234"

@patch.dict(os.environ, {"JUPYTER_BOKEH_EXTERNAL_URL": "https://our-hub.edu"})
@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/homer@donuts.edu/"})
def test__remote_jupyter_proxy_url_1() -> None:
    assert binb._remote_jupyter_proxy_url(None) == "our-hub.edu"


@patch.dict(os.environ, {"JUPYTER_BOKEH_EXTERNAL_URL": "https://our-hub.edu"})
@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/home@donuts.edu/"})
@patch.object(log, "warning")
def test__update_notebook_url_from_env_1(mock_warning) -> None:
    rval = binb._update_notebook_url_from_env("https://our-hub.edu:9999")
    assert mock_warning.called
    assert rval == binb._remote_jupyter_proxy_url

@patch.dict(os.environ, {"JUPYTER_BOKEH_EXTERNAL_URL": "https://our-hub.edu"})
@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/home@donuts.edu/"})
@patch.object(log, "warning")
def test__update_notebook_url_from_env_2(mock_warning) -> None:
    rval = binb._update_notebook_url_from_env("localhost:8888")
    assert not mock_warning.called
    assert rval == binb._remote_jupyter_proxy_url

@patch.dict(os.environ, {"JUPYTER_BOKEH_EXTERNAL_URL": "https://our-hub.edu"})
@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/home@donuts.edu/"})
@patch.object(log, "warning")
def test__update_notebook_url_from_env_3(mock_warning) -> None:
    rval = binb._update_notebook_url_from_env(None)
    assert mock_warning.called
    assert rval == binb._remote_jupyter_proxy_url

@patch.dict(os.environ, {"JUPYTER_BOKEH_EXTERNAL_URL": "https://our-hub.edu"})
@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/home@donuts.edu/"})
@patch.object(log, "warning")
def test__update_notebook_url_from_env_4(mock_warning) -> None:
    def proxy_url_func(int):
        return "https://some-url.com"
    rval = binb._update_notebook_url_from_env(proxy_url_func)
    assert mock_warning.called
    assert rval == binb._remote_jupyter_proxy_url


@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/home@donuts.edu/"})
@patch.object(log, "warning")
def test__update_notebook_url_from_env_5(mock_warning) -> None:
    rval = binb._update_notebook_url_from_env("https://our-hub.edu:9999")
    assert not mock_warning.called
    assert rval == "https://our-hub.edu:9999"

@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/home@donuts.edu/"})
@patch.object(log, "warning")
def test__update_notebook_url_from_env_6(mock_warning) -> None:
    rval = binb._update_notebook_url_from_env("localhost:8888")
    assert not mock_warning.called
    assert rval == "localhost:8888"

@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/home@donuts.edu/"})
@patch.object(log, "warning")
def test__update_notebook_url_from_env_7(mock_warning) -> None:
    rval = binb._update_notebook_url_from_env(None)
    assert not mock_warning.called
    assert rval is None

@patch.dict(os.environ, {"JUPYTERHUB_SERVICE_PREFIX": "/user/home@donuts.edu/"})
@patch.object(log, "warning")
def test__update_notebook_url_from_env_8(mock_warning) -> None:
    def proxy_url_func(int):
        return "https://some-url.com"
    rval = binb._update_notebook_url_from_env(proxy_url_func)
    assert not mock_warning.called
    assert rval == proxy_url_func

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
