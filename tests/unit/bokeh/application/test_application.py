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
import logging
from threading import Event, get_ident
from unittest.mock import MagicMock, patch

# Bokeh imports
from bokeh.application.handlers import CodeHandler, FunctionHandler, Handler
from bokeh.core.properties import Instance, Int, Nullable
from bokeh.document import Document
from bokeh.model import Model
from bokeh.plotting import figure
from bokeh.util.logconfig import basicConfig

# Module under test
import bokeh.application.application as baa # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# needed for caplog tests to function
basicConfig()

class AnotherModelInTestApplication(Model):
    baar = Int(1)

class SomeModelInTestApplication(Model):
    foo = Int(2)
    child = Nullable(Instance(Model))

class RequestHandler(Handler):
    _failed = False
    _static = None
    def __init__(self, data) -> None:
        self._data = data

    def process_request(self, request):
        return self._data

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------


class Test_Application:
    # Public methods ----------------------------------------------------------

    def test_empty(self) -> None:
        a = baa.Application()
        doc = a.create_document()
        assert not doc.roots

    def test_invalid_kwarg(self) -> None:
        with pytest.raises(TypeError):
            baa.Application(junk="foo")

    def test_process_request(self) -> None:
        a = baa.Application()
        a.add(RequestHandler(dict(a=10)))
        a.add(RequestHandler(dict(b=20)))
        a.add(RequestHandler(dict(a=30)))
        assert a.process_request("request") == dict(a=30, b=20)

    async def test_process_request_async_runs_sync_handlers_in_worker(self) -> None:
        started = Event()
        release = Event()
        loop_thread = get_ident()
        handler_thread = None

        class BlockingRequestHandler(Handler):
            def process_request(self, request):
                nonlocal handler_thread
                handler_thread = get_ident()
                started.set()
                assert release.wait(timeout=2)
                return dict(a=10)

        a = baa.Application(BlockingRequestHandler())
        pending = asyncio.create_task(a.process_request_async("request"))
        try:
            async with asyncio.timeout(1):
                while not started.is_set():
                    await asyncio.sleep(0)
            heartbeat = asyncio.Event()
            asyncio.get_running_loop().call_soon(heartbeat.set)
            await asyncio.wait_for(heartbeat.wait(), 1)
        finally:
            release.set()

        assert await pending == dict(a=10)
        assert handler_thread != loop_thread

    async def test_process_request_async_awaits_async_handlers_in_order(self) -> None:
        loop_thread = get_ident()
        calls = []

        class AsyncRequestHandler(Handler):
            async def process_request(self, request):
                calls.append(("async", get_ident()))
                await asyncio.sleep(0)
                return dict(a=10)

        class SyncRequestHandler(Handler):
            def process_request(self, request):
                calls.append(("sync", get_ident()))
                return dict(a=20, b=30)

        a = baa.Application(AsyncRequestHandler(), SyncRequestHandler())

        assert await a.process_request_async("request") == dict(a=20, b=30)
        assert calls[0] == ("async", loop_thread)
        assert calls[1][0] == "sync"
        assert calls[1][1] != loop_thread

    def test_one_handler(self) -> None:
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        doc = a.create_document()
        assert len(doc.roots) == 2

    def test_two_handlers(self) -> None:
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        a.add(handler2)
        doc = a.create_document()
        assert len(doc.roots) == 3

    def test_two_handlers_in_init(self) -> None:
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        handler2 = FunctionHandler(add_one_root)
        a = baa.Application(handler, handler2)
        doc = a.create_document()
        assert len(doc.roots) == 3

    def test_safe_to_fork(self) -> None:
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        handler2 = FunctionHandler(add_one_root)
        a = baa.Application(handler, handler2)
        assert a.safe_to_fork
        a.create_document()
        assert not a.safe_to_fork

    def test_metadata(self) -> None:
        a = baa.Application(metadata="foo")
        a.create_document()
        assert a.metadata == "foo"

    def test_failed_handler(self, caplog: pytest.LogCaptureFixture) -> None:
        a = baa.Application()
        handler = CodeHandler(filename="junk", source="bad(")
        a.add(handler)
        d = Document()
        with caplog.at_level(logging.ERROR):
            assert len(caplog.records) == 0
            a.initialize_document(d)
            assert len(caplog.records) == 1

    def test_no_static_path(self) -> None:
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        a.add(handler2)
        assert a.static_path is None

    def test_static_path(self) -> None:
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        handler._static = "foo"
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        a.add(handler2)
        assert a.static_path == "foo"

    def test_excess_static_path(self) -> None:
        a = baa.Application()
        def add_roots(doc):
            doc.add_root(AnotherModelInTestApplication())
            doc.add_root(SomeModelInTestApplication())
        def add_one_root(doc):
            doc.add_root(AnotherModelInTestApplication())
        handler = FunctionHandler(add_roots)
        handler._static = "foo"
        a.add(handler)
        handler2 = FunctionHandler(add_one_root)
        handler2._static = "bar"
        with pytest.raises(RuntimeError) as e:
            a.add(handler2)
        assert "More than one static path" in str(e.value)

    @patch('bokeh.document.document.check_integrity')
    def test_application_validates_document_by_default(self, check_integrity: MagicMock) -> None:
        a = baa.Application()
        d = Document()
        d.add_root(figure())
        a.initialize_document(d)
        assert check_integrity.called

    @patch('bokeh.document.document.check_integrity')
    def test_application_doesnt_validate_document_due_to_env_var(self, check_integrity: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("BOKEH_VALIDATE_DOC", "false")
        a = baa.Application()
        d = Document()
        d.add_root(figure())
        a.initialize_document(d)
        assert not check_integrity.called

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------


class Test_ServerContext:
    # Public methods ----------------------------------------------------------

    def test_abstract(self) -> None:
        with pytest.raises(TypeError):
            baa.ServerContext()


class Test_SessionContext:
    def test_abstract(self) -> None:
        with pytest.raises(TypeError):
            baa.SessionContext()

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
