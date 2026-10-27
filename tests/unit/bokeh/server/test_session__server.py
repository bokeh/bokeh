#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------
import asyncio
from threading import Event, get_ident
from unittest import mock

import numpy as np
import pytest

from bokeh.core.properties import Int
from bokeh.document import Document
from bokeh.io import curdoc
from bokeh.model import Model
from bokeh.models import ColumnDataSource
from bokeh.protocol import pull_doc_req
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

class TrackingConstructor:

    def __init__(self, constructor, started: Event | None = None, release: Event | None = None) -> None:
        self.constructor = constructor
        self.started = started
        self.release = release
        self.thread_ids: list[int] = []
        self.current_documents: list[Document] = []

    def __call__(self, *args, **kwargs):
        self.thread_ids.append(get_ident())
        self.current_documents.append(curdoc())
        if self.started is not None:
            self.started.set()
        if self.release is not None:
            assert self.release.wait(timeout=2)
        return self.constructor(*args, **kwargs)

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

def make_connection(document: Document, executor: _ServerExecutor) -> tuple[bss.ServerSession, RecordingSocket, ServerConnection]:
    session = bss.ServerSession("some-id", document, executor=executor)
    socket = RecordingSocket()
    connection = ServerConnection(socket, session)
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
    constructor = TrackingConstructor(bss.patch_doc)
    session, socket, _ = make_connection(document, executor)
    array = np.array([1.0, 2.0])

    try:
        with mock.patch.object(bss, "patch_doc", constructor):
            await session.with_document_locked(lambda: setattr(source, "data", {"a": array}))
        [message] = socket.messages
        [buffer] = message.buffers
        expected = buffer.data

        assert constructor.thread_ids and constructor.thread_ids[0] != main_thread
        assert constructor.current_documents == [document]
        assert socket.thread_ids == [main_thread]
        assert isinstance(expected, bytes)
        assert message.envelope_json == message._envelope_json

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
    constructor = TrackingConstructor(bss.patch_doc, started, release)
    session, socket, _ = make_connection(document, executor)

    with mock.patch.object(bss, "patch_doc", constructor):
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
    constructor = TrackingConstructor(bss.patch_doc)
    session, socket, _ = make_connection(document, executor)

    def update() -> None:
        root.value = 1
        root.value = 2

    try:
        with mock.patch.object(bss, "patch_doc", constructor):
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
    constructor = TrackingConstructor(bss.pull_doc_reply)
    session = bss.ServerSession("some-id", document, executor=executor)
    socket = RecordingSocket(block_first=True)
    connection = ServerConnection(socket, session)
    request = pull_doc_req()

    with mock.patch.object(bss, "pull_doc_reply", constructor):
        pull = asyncio.create_task(connection.handle(request))
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
            assert constructor.thread_ids and constructor.thread_ids[0] != get_ident()
            assert constructor.current_documents == [document]
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


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
@pytest.mark.parametrize("hold", [False, True])
async def test_held_selection_container_mutations_reach_clients(attr: str, hold: bool) -> None:
    from bokeh.models import Selection

    multiline = attr == "multiline_indices"
    initial = {7: [1]} if multiline else [1]
    selection = Selection(**{attr: initial})
    held = getattr(selection, attr)
    document = Document()
    document.add_root(selection)
    clients = [Document.from_json(document.to_json()) for _ in range(2)]
    executor = _ServerExecutor(max_workers=1)
    session, origin, _ = make_connection(document, executor)
    peer = RecordingSocket()
    ServerConnection(peer, session)
    changes = []

    def snapshot(value):
        return {key: list(indices) for key, indices in value.items()} if multiline else list(value)

    def callback(attr, old, new):
        assert getattr(selection, attr) is held
        changes.append((snapshot(old), snapshot(new)))

    selection.on_change(attr, callback)
    first = {7: [1, 5]} if multiline else [1, 5]
    second = {2: [9], 7: [1, 5]} if multiline else [1, 5, 7]
    try:
        for step, expected in enumerate([first, second]):
            if hold:
                await session.with_document_locked(document.hold)

            def mutate():
                if multiline:
                    if step == 0:
                        held[7] = [5, 1, 5]
                    else:
                        held[2] = [9, 9]
                else:
                    held.append(5 if step == 0 else 7)

            await session.with_document_locked(mutate)
            if hold:
                assert len(changes) == len(origin.messages) == len(peer.messages) == step
                await session.with_document_locked(document.unhold)
            assert getattr(selection, attr) is held
            assert snapshot(held) == expected
            for socket, client in zip([origin, peer], clients):
                assert len(socket.messages) == step + 1
                message = socket.messages[-1]
                assert len(message.buffers) == 1
                client.apply_json_patch(message.payload)
                assert snapshot(getattr(client.roots[0], attr)) == expected
        assert changes == [(initial, first), (first, second)]

        def unchanged_mutation():
            if multiline:
                held[7] = [5, 1, 5]
            else:
                held.append(7)

        await session.with_document_locked(unchanged_mutation)
        assert len(changes) == len(origin.messages) == len(peer.messages) == 2
    finally:
        executor.shutdown()


@pytest.mark.parametrize("attr", ["indices", "line_indices", "multiline_indices"])
@pytest.mark.parametrize("hold", [False, True])
async def test_selection_patch_callbacks_forwarding_and_setter_suppression(attr: str, hold: bool) -> None:
    from bokeh.core.serialization import Deserializer, Serialized
    from bokeh.document.events import ModelChangedEvent
    from bokeh.models import Selection
    from bokeh.protocol import patch_doc, pull_doc_reply

    def value(indices):
        return {7: indices, 42: []} if attr == "multiline_indices" else indices

    selection = Selection()
    document = Document()
    document.add_root(selection)
    executor = _ServerExecutor(max_workers=1)
    session, origin, connection = make_connection(document, executor)
    peer = RecordingSocket()
    ServerConnection(peer, session)
    changes = []
    selection.on_change(attr, lambda attr, old, new: changes.append((old, new)))
    expected = value(list(range(300)))
    incoming = patch_doc([ModelChangedEvent(document, selection, attr, expected)])
    try:
        if hold:
            await session.with_document_locked(document.hold)
        reply = await connection.handle(incoming)
        assert reply.msgtype == "OK"
        if hold:
            assert changes == []
            assert peer.messages == []
            await session.with_document_locked(document.unhold)
        assert len(changes) == 1
        actual = getattr(selection, attr)
        assert actual == expected
        assert isinstance(actual[7] if attr == "multiline_indices" else actual, list)
        # A hold released after the originating request has finished forwards to both clients.
        assert len(origin.messages) == int(hold)
        assert len(peer.messages) == 1
        message = peer.messages[0]
        assert len(message.buffers) == 1
        event = Deserializer([selection]).deserialize(message.payload)["events"][0]
        assert event["new"] == expected
        # Replaying the same set does not notify or forward another patch.
        await connection.handle(incoming)
        assert len(changes) == len(peer.messages) == 1
        origin.messages.clear()
        # A callback's server-side update must reach both clients.
        def callback(attr, old, new):
            selection.image_indices = [dict(index=0, i=1, j=2, flat_index=3)]
        selection.on_change(attr, callback)
        await connection.handle(patch_doc([ModelChangedEvent(document, selection, attr, value([1, 9]))]))
        assert len(changes) == 2
        assert [m.content["events"][0]["attr"] for m in origin.messages] == ["image_indices"]
        assert [m.content["events"][0]["attr"] for m in peer.messages[1:]] == ["image_indices", attr]
        # Full pull replies also restore ordinary public values.
        reply = pull_doc_reply("request", document)
        restored = Document.from_json(Serialized(reply.content["doc"], reply.buffers))
        assert getattr(restored.roots[0], attr) == value([1, 9])
    finally:
        executor.shutdown()
