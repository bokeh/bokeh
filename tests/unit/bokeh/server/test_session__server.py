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
from threading import Event, get_ident
from unittest import mock

# External imports
import numpy as np

# Bokeh imports
from bokeh.core.properties import Int
from bokeh.document import Document
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.models import ColumnDataSource
from bokeh.protocol import Protocol
from bokeh.server.connection import ServerConnection
from bokeh.server.executor import _ServerExecutor

# Module under test
import bokeh.server.session as bss # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class SomeModelInTestServerSession(Model):
    value = Int(default=0)

class TrackingProtocol(Protocol):

    def __init__(self, tracked: str, started: Event | None = None, release: Event | None = None) -> None:
        super().__init__()
        self.tracked = tracked
        self.started = started
        self.release = release
        self.thread_ids: list[int] = []
        self.current_documents: list[Document] = []

    def create(self, msgtype, *args, **kwargs):
        if msgtype == self.tracked:
            self.thread_ids.append(get_ident())
            self.current_documents.append(curdoc())
            if self.started is not None:
                self.started.set()
            if self.release is not None:
                assert self.release.wait(timeout=2)
        return super().create(msgtype, *args, **kwargs)

class RecordingSocket:

    def __init__(self, block_first: bool = False) -> None:
        self.messages = []
        self.thread_ids: list[int] = []
        self.started = asyncio.Event()
        self.release = asyncio.Event()
        if not block_first:
            self.release.set()

    async def send_message(self, message) -> None:
        self.thread_ids.append(get_ident())
        self.started.set()
        await self.release.wait()
        self.messages.append(message)

def make_connection(document: Document, protocol: Protocol, executor: _ServerExecutor) -> tuple[bss.ServerSession, RecordingSocket, ServerConnection]:
    session = bss.ServerSession("some-id", document, executor=executor)
    socket = RecordingSocket()
    connection = ServerConnection(protocol, socket, mock.Mock(), session)
    return session, socket, connection

def test_creation() -> None:
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    assert s.id == 'some-id'
    assert s.document == d
    assert s.destroyed is False
    assert s.expiration_requested is False
    assert s.expiration_blocked == 0

def test_subscribe() -> None:
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    assert s.connection_count == 0
    s.subscribe('connection1')
    assert s.connection_count == 1
    s.subscribe('connection2')
    assert s.connection_count == 2
    s.unsubscribe('connection1')
    assert s.connection_count == 1
    s.unsubscribe('connection2')
    assert s.connection_count == 0

def test_destroy_calls() -> None:
    d = Document()
    s = bss.ServerSession('some-id', d, 'ioloop')
    with mock.patch('bokeh.document.modules.DocumentModuleManager.destroy') as docdm:
        with mock.patch('bokeh.document.Document.remove_on_change') as docroc:
            s.destroy()
            assert s.destroyed
            docroc.assert_called_with(s)
        docdm.assert_called_once()

async def test_patch_serialization_runs_off_loop_and_freezes_buffers() -> None:
    main_thread = get_ident()
    executor = _ServerExecutor(max_workers=1)
    document = Document()
    source = ColumnDataSource(data={"a": np.array([0.0])})
    document.add_root(source)
    document.to_json()
    protocol = TrackingProtocol("PATCH-DOC")
    session, socket, _ = make_connection(document, protocol, executor)
    array = np.array([1.0, 2.0])

    try:
        await session.with_document_locked(lambda: setattr(source, "data", {"a": array}))
        [message] = socket.messages
        [buffer] = message.buffers
        expected = buffer.data

        assert protocol.thread_ids and protocol.thread_ids[0] != main_thread
        assert protocol.current_documents == [document]
        assert socket.thread_ids == [main_thread]
        assert isinstance(expected, bytes)
        assert message.content_json == message._content_json

        array[0] = 10.0
        assert buffer.data == expected
    finally:
        executor.shutdown()

async def test_patch_cancellation_waits_for_serialization_and_write() -> None:
    executor = _ServerExecutor(max_workers=1)
    started = Event()
    release = Event()
    document = Document()
    root = SomeModelInTestServerSession()
    document.add_root(root)
    document.to_json()
    protocol = TrackingProtocol("PATCH-DOC", started, release)
    session, socket, _ = make_connection(document, protocol, executor)

    task = asyncio.create_task(session.with_document_locked(lambda: setattr(root, "value", 1)))
    try:
        async with asyncio.timeout(1):
            while not started.is_set():
                await asyncio.sleep(0)

        task.cancel()
        await asyncio.sleep(0)
        assert not task.done()
        assert not socket.messages
    finally:
        release.set()

    with pytest.raises(asyncio.CancelledError):
        await task
    assert len(socket.messages) == 1

    executor.shutdown()

async def test_patch_messages_preserve_event_order() -> None:
    executor = _ServerExecutor(max_workers=1)
    document = Document()
    root = SomeModelInTestServerSession()
    document.add_root(root)
    document.to_json()
    protocol = TrackingProtocol("PATCH-DOC")
    session, socket, _ = make_connection(document, protocol, executor)

    def update() -> None:
        root.value = 1
        root.value = 2

    try:
        await session.with_document_locked(update)
        assert [
            message.content["events"][0]["new"]
            for message in socket.messages
        ] == [1, 2]
    finally:
        executor.shutdown()

async def test_pull_reply_precedes_later_patch_and_is_cancellation_safe() -> None:
    executor = _ServerExecutor(max_workers=1)
    document = Document()
    root = SomeModelInTestServerSession()
    document.add_root(root)
    protocol = TrackingProtocol("PULL-DOC-REPLY")
    session = bss.ServerSession("some-id", document, executor=executor)
    socket = RecordingSocket(block_first=True)
    connection = ServerConnection(protocol, socket, mock.Mock(), session)
    request = protocol.create("PULL-DOC-REQ")

    pull = asyncio.create_task(bss.ServerSession.pull(request, connection))
    try:
        await asyncio.wait_for(socket.started.wait(), timeout=1)
        pull.cancel()
        patch = asyncio.create_task(session.with_document_locked(lambda: setattr(root, "value", 1)))
        await asyncio.sleep(0)

        assert not pull.done()
        assert not patch.done()

        socket.release.set()
        with pytest.raises(asyncio.CancelledError):
            await pull
        await patch

        assert [message.msgtype for message in socket.messages] == ["PULL-DOC-REPLY", "PATCH-DOC"]
        assert all(thread_id == get_ident() for thread_id in socket.thread_ids)
        assert protocol.thread_ids and protocol.thread_ids[0] != get_ident()
        assert protocol.current_documents == [document]
    finally:
        executor.shutdown()

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
