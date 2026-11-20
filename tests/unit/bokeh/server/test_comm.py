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
from collections.abc import Callable
from typing import Any

import numpy as np

from bokeh.application import Application
from bokeh.application.handlers.function import FunctionHandler
from bokeh.application.handlers.lifecycle import LifecycleHandler
from bokeh.core.serialization import Serialized
from bokeh.document import Document
from bokeh.document.events import DocumentChangedEvent
from bokeh.models import ColumnDataSource, Div, FileInput, Slider
from bokeh.models.widgets.inputs import ClearInput
from bokeh.protocol import patch_doc, pull_doc_req, replace_document
from bokeh.protocol.message import Message
from bokeh.protocol.receiver import Receiver

# Module under test
from bokeh.server.comm import CommApplicationContext, CommServerSession, CommSessionEndpoint # isort:skip

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

class FakeComm:
    ''' The kernel side of a comm, driven by a test acting as the frontend. '''

    def __init__(self) -> None:
        self.sent: list[tuple[dict[str, Any], list[bytes]]] = []
        self.closed = False
        self._on_msg: Callable[[dict[str, Any]], None] | None = None
        self._on_close: Callable[[Any], None] | None = None
        self._receiver = Receiver()

    def send(self, data: Any = None, buffers: list[bytes] | None = None) -> None:
        assert not self.closed
        self.sent.append((data, list(buffers or [])))

    def on_msg(self, callback: Callable[[dict[str, Any]], None]) -> None:
        self._on_msg = callback

    def on_close(self, callback: Callable[[Any], None]) -> None:
        self._on_close = callback

    def close(self) -> None:
        self.closed = True

    # Frontend side

    def frontend_send(self, data: dict[str, Any], buffers: list[bytes] | None = None) -> None:
        assert self._on_msg is not None
        self._on_msg({"content": {"data": data}, "buffers": [memoryview(buffer) for buffer in buffers or []]})

    def frontend_send_message(self, message: Message[Any]) -> None:
        (envelope, _), *buffers = message.fragments()
        self.frontend_send({"kind": "bokeh", "envelope": envelope}, [buffer for buffer, _ in buffers])

    def frontend_close(self) -> None:
        self.closed = True
        assert self._on_close is not None
        self._on_close({})

    def kinds(self) -> list[str]:
        return [data["kind"] for data, _ in self.sent]

    def messages(self) -> list[Message[Any]]:
        messages: list[Message[Any]] = []
        for data, buffers in self.sent:
            if data["kind"] != "bokeh":
                continue
            message = self._receiver.consume(data["envelope"])
            for buffer in buffers:
                message = self._receiver.consume(buffer)
            assert message is not None
            messages.append(message)
        return messages

    def msgtypes(self) -> list[str]:
        return [message.msgtype for message in self.messages()]


async def until(predicate: Callable[[], bool], timeout: float = 5) -> None:
    async with asyncio.timeout(timeout):
        while not predicate():
            await asyncio.sleep(0.005)


def slider_app(*, on_value: Callable[[Slider, int], None] | None = None) -> Callable[[Document], None]:
    def modify(doc: Document) -> None:
        slider = Slider(start=0, end=10, value=1, name="slider")
        if on_value is not None:
            slider.on_change("value", lambda _attr, _old, new: on_value(slider, new))
        doc.add_root(slider)
    return modify


def context_for(*handlers: Any) -> CommApplicationContext:
    return CommApplicationContext(Application(*handlers), url="/")


async def connected(context: CommApplicationContext, **kwargs: Any) -> tuple[CommSessionEndpoint, FakeComm, Document]:
    ''' Open a comm session and pull a client copy of its document. '''
    comm = FakeComm()
    endpoint = CommSessionEndpoint(context, comm, **kwargs)
    await until(lambda: "session" in comm.kinds() or comm.closed)
    comm.frontend_send({"kind": "connect"})
    await until(lambda: "ACK" in comm.msgtypes())
    comm.frontend_send_message(pull_doc_req())
    await until(lambda: "PULL-DOC-REPLY" in comm.msgtypes())
    reply = next(message for message in comm.messages() if message.msgtype == "PULL-DOC-REPLY")
    client = Document()
    replace_document(reply, client)
    comm.sent.clear()
    return endpoint, comm, client


def client_patch(client: Document, change: Callable[[Document], None]) -> Message[Any]:
    events: list[DocumentChangedEvent] = []
    client.on_change(lambda event: events.append(event))
    change(client)
    return patch_doc(events)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

class TestCommSessionEndpoint:

    async def test_creates_one_session_per_comm(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        first, _, first_client = await connected(context, describe=lambda session: {"session_id": session.id})
        second, _, second_client = await connected(context, describe=lambda session: {"session_id": session.id})

        assert first.session is not None and second.session is not None
        assert first.session is not second.session
        assert first.session.document is not second.session.document
        assert isinstance(first.session, CommServerSession)
        assert {session.id for session in context.sessions} == {first.session.id, second.session.id}
        assert first_client.get_model_by_name("slider").value == 1
        assert second_client.get_model_by_name("slider").value == 1

        first.close()
        second.close()
        await asyncio.gather(first.task, second.task)
        assert list(context.sessions) == []

    async def test_session_message_precedes_connection(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        comm = FakeComm()
        endpoint = CommSessionEndpoint(context, comm, describe=lambda session: {"resource_id": "resources"})
        await until(lambda: bool(comm.sent))

        assert comm.sent == [({"kind": "session", "resource_id": "resources"}, [])]
        assert endpoint.session is not None
        assert endpoint.session.connection_count == 0

        comm.frontend_send({"kind": "connect"})
        await until(lambda: len(comm.sent) == 2)
        assert comm.msgtypes() == ["ACK"]
        assert endpoint.session.connection_count == 1

        endpoint.close()
        await endpoint.task

    async def test_patch_runs_python_callback_and_returns_its_changes(self) -> None:
        def clamp(slider: Slider, value: int) -> None:
            if value > 5:
                slider.value = 5

        context = context_for(FunctionHandler(slider_app(on_value=clamp)))
        endpoint, comm, client = await connected(context)
        slider = client.get_model_by_name("slider")

        comm.frontend_send_message(client_patch(client, lambda _doc: setattr(slider, "value", 9)))
        await until(lambda: "OK" in comm.msgtypes())

        assert endpoint.session is not None
        assert endpoint.session.document.get_model_by_name("slider").value == 5
        patches = [message for message in comm.messages() if message.msgtype == "PATCH-DOC"]
        assert [event["new"] for message in patches for event in message.content["events"]] == [5]
        # The browser's own change is not echoed back, the callback's correction is.
        assert comm.msgtypes()[-1] == "OK"

        endpoint.close()
        await endpoint.task

    async def test_messages_are_handled_in_order(self) -> None:
        seen: list[int] = []
        context = context_for(FunctionHandler(slider_app(on_value=lambda _slider, value: seen.append(value))))
        endpoint, comm, client = await connected(context)
        slider = client.get_model_by_name("slider")

        for value in range(2, 9):
            comm.frontend_send_message(client_patch(client, lambda _doc, value=value: setattr(slider, "value", value)))
        await until(lambda: comm.msgtypes().count("OK") == 7)

        assert seen == list(range(2, 9))
        endpoint.close()
        await endpoint.task

    async def test_two_sessions_of_one_application_are_independent(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        first, first_comm, first_client = await connected(context)
        second, second_comm, _ = await connected(context)

        slider = first_client.get_model_by_name("slider")
        first_comm.frontend_send_message(client_patch(first_client, lambda _doc: setattr(slider, "value", 7)))
        await until(lambda: "OK" in first_comm.msgtypes())

        assert first.session is not None and second.session is not None
        assert first.session.document.get_model_by_name("slider").value == 7
        assert second.session.document.get_model_by_name("slider").value == 1
        assert second_comm.sent == []

        first.close()
        second.close()
        await asyncio.gather(first.task, second.task)

    async def test_callback_error_is_reported_with_its_traceback(self) -> None:
        def fail(_slider: Slider, _value: int) -> None:
            raise ZeroDivisionError("bad slider value")

        context = context_for(FunctionHandler(slider_app(on_value=fail)))
        endpoint, comm, client = await connected(context)
        slider = client.get_model_by_name("slider")

        patch = client_patch(client, lambda _doc: setattr(slider, "value", 3))
        comm.frontend_send_message(patch)
        await until(lambda: "ERROR" in comm.msgtypes())

        error = comm.messages()[-1]
        assert error.header["reqid"] == patch.header["msgid"]
        assert error.content["text"] == "ZeroDivisionError: bad slider value"
        assert "raise ZeroDivisionError" in error.content["traceback"]
        assert not comm.closed

        endpoint.close()
        await endpoint.task

    async def test_handler_error_is_reported_and_closes_the_comm(self) -> None:
        def broken(_doc: Document) -> None:
            raise ValueError("no data")

        context = context_for(FunctionHandler(broken))
        comm = FakeComm()
        endpoint = CommSessionEndpoint(context, comm)
        await endpoint.task

        [(data, _)] = comm.sent
        assert data["kind"] == "error"
        assert data["code"] == "APPLICATION_SESSION_FAILED"
        assert data["message"] == "ValueError: no data"
        assert 'raise ValueError("no data")' in data["traceback"]
        assert comm.closed
        assert endpoint.closed

    async def test_trapped_handler_error_is_reported(self) -> None:
        def broken(_doc: Document) -> None:
            raise ValueError("no data")

        context = context_for(FunctionHandler(broken, trap_exceptions=True))
        comm = FakeComm()
        endpoint = CommSessionEndpoint(context, comm)
        await endpoint.task

        [(data, _)] = comm.sent
        assert data["code"] == "APPLICATION_SESSION_FAILED"
        assert "no data" in data["message"]
        assert list(context.sessions) == []

    async def test_document_changes_outside_callbacks_are_sent_immediately(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        endpoint, comm, _ = await connected(context)
        assert endpoint.session is not None

        # A later notebook cell changes the session document directly.
        endpoint.session.document.get_model_by_name("slider").value = 4

        [message] = comm.messages()
        assert message.msgtype == "PATCH-DOC"
        assert message.content["events"][0]["new"] == 4

        endpoint.close()
        await endpoint.task

    async def test_next_tick_callbacks_reach_the_view(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        endpoint, comm, _ = await connected(context)
        assert endpoint.session is not None
        doc = endpoint.session.document

        doc.add_next_tick_callback(lambda: setattr(doc.get_model_by_name("slider"), "value", 6))
        await until(lambda: "PATCH-DOC" in comm.msgtypes())

        assert comm.messages()[0].content["events"][0]["new"] == 6
        endpoint.close()
        await endpoint.task

    async def test_frontend_close_discards_the_session(self) -> None:
        destroyed: list[str] = []
        lost: list[str] = []

        def modify(doc: Document) -> None:
            slider_app()(doc)
            doc.on_event("connection_lost", lambda _event: lost.append("lost"))

        lifecycle = LifecycleHandler()
        lifecycle._on_session_destroyed = lambda context: destroyed.append(context.id)
        context = context_for(FunctionHandler(modify), lifecycle)
        closed: list[CommSessionEndpoint] = []
        endpoint, comm, _ = await connected(context, on_close=closed.append)
        assert endpoint.session is not None
        session_id = endpoint.session.id

        comm.frontend_close()
        await endpoint.task

        assert endpoint.closed
        assert endpoint.session.destroyed
        assert list(context.sessions) == []
        assert destroyed == [session_id]
        assert lost == ["lost"]
        assert closed == [endpoint]

    async def test_kernel_close_notifies_the_frontend(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        endpoint, comm, _ = await connected(context)

        endpoint.close()
        await endpoint.task

        assert comm.kinds() == ["close"]
        assert comm.closed
        assert list(context.sessions) == []

    async def test_bokeh_message_before_connect_is_a_protocol_error(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        comm = FakeComm()
        endpoint = CommSessionEndpoint(context, comm)
        await until(lambda: "session" in comm.kinds())

        comm.frontend_send_message(pull_doc_req())
        await endpoint.task

        assert comm.kinds() == ["session", "error"]
        assert comm.sent[-1][0]["code"] == "PROTOCOL_ERROR"
        assert comm.closed
        assert list(context.sessions) == []

    async def test_comm_closed_before_the_session_exists_discards_it(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        comm = FakeComm()
        endpoint = CommSessionEndpoint(context, comm)

        comm.frontend_close()
        await endpoint.task

        assert comm.sent == []
        assert list(context.sessions) == []

    async def test_extra_binary_buffers_are_a_protocol_error(self) -> None:
        context = context_for(FunctionHandler(slider_app()))
        endpoint, comm, client = await connected(context)
        slider = client.get_model_by_name("slider")

        (envelope, _), *_ = client_patch(client, lambda _doc: setattr(slider, "value", 2)).fragments()
        comm.frontend_send({"kind": "bokeh", "envelope": envelope}, [b"unexpected"])
        await endpoint.task

        assert comm.sent[-1][0]["code"] == "PROTOCOL_ERROR"
        assert comm.closed


def event_app(doc: Document) -> None:
    upload = FileInput(name="upload")
    slider = Slider(start=0, end=10, value=1, name="slider")
    slider.on_change("value", lambda _attr, _old, _new: upload.clear())
    doc.add_root(upload)
    doc.add_root(slider)


def message_events(comm: FakeComm) -> list[dict[str, Any]]:
    return [
        event for message in comm.messages() if message.msgtype == "PATCH-DOC"
        for event in message.content["events"] if event["kind"] == "MessageSent"
    ]


class TestCustomEvents:

    async def test_events_sent_from_a_later_cell_reach_the_view(self) -> None:
        context = context_for(FunctionHandler(event_app))
        endpoint, comm, client = await connected(context)
        assert endpoint.session is not None
        upload = endpoint.session.document.get_model_by_name("upload")

        upload.clear()

        [event] = message_events(comm)
        assert event["msg_type"] == "bokeh_event"
        assert event["msg_data"]["name"] == "clear_input"
        received: list[Any] = []
        client.on_message("bokeh_event", received.append)
        [message] = comm.messages()
        client.apply_json_patch(Serialized(message.content, message.buffers))
        assert len(received) == 1
        assert isinstance(received[0], ClearInput)
        assert received[0].model is client.get_model_by_name("upload")

        endpoint.close()
        await endpoint.task

    async def test_events_sent_by_python_callbacks_reach_the_view(self) -> None:
        context = context_for(FunctionHandler(event_app))
        endpoint, comm, client = await connected(context)
        slider = client.get_model_by_name("slider")

        comm.frontend_send_message(client_patch(client, lambda _doc: setattr(slider, "value", 3)))
        await until(lambda: "OK" in comm.msgtypes())

        [event] = message_events(comm)
        assert event["msg_data"]["name"] == "clear_input"
        assert comm.msgtypes() == ["PATCH-DOC", "OK"]

        endpoint.close()
        await endpoint.task


def binary_app(doc: Document) -> None:
    source = ColumnDataSource(data={"x": np.arange(4, dtype=np.float64)}, name="source")
    total = Div(text="", name="total")

    def summarize(attr: str, old: Any, new: Any) -> None:
        x = source.data["x"]
        total.text = f"{type(x).__name__}:{float(np.sum(x))}"

    source.on_change("data", summarize)
    doc.add_root(source)
    doc.add_root(total)


class TestBinaryBuffers:

    async def test_pull_reply_carries_arrays_as_comm_buffers(self) -> None:
        context = context_for(FunctionHandler(binary_app))
        comm = FakeComm()
        endpoint = CommSessionEndpoint(context, comm)
        await until(lambda: "session" in comm.kinds())
        comm.frontend_send({"kind": "connect"})
        comm.frontend_send_message(pull_doc_req())
        await until(lambda: "PULL-DOC-REPLY" in comm.msgtypes())

        _, buffers = next(item for item in comm.sent if item[0]["kind"] == "bokeh" and "PULL-DOC-REPLY" in item[0]["envelope"])
        assert len(buffers) == 1
        assert all(isinstance(buffer, bytes) for buffer in buffers)
        reply = comm.messages()[-1]
        client = Document()
        replace_document(reply, client)
        np.testing.assert_array_equal(client.get_model_by_name("source").data["x"], np.arange(4, dtype=np.float64))

        endpoint.close()
        await endpoint.task

    async def test_browser_arrays_reach_python_callbacks(self) -> None:
        context = context_for(FunctionHandler(binary_app))
        endpoint, comm, client = await connected(context)
        source = client.get_model_by_name("source")
        values = np.array([1.5, 2.5, 3.0], dtype=np.float64)

        patch = client_patch(client, lambda _doc: setattr(source, "data", {"x": values}))
        assert len(patch.buffers) == 1
        comm.frontend_send_message(patch)
        await until(lambda: "OK" in comm.msgtypes())

        assert endpoint.session is not None
        server = endpoint.session.document
        np.testing.assert_array_equal(server.get_model_by_name("source").data["x"], values)
        assert server.get_model_by_name("total").text == "ndarray:7.0"
        [correction] = [message for message in comm.messages() if message.msgtype == "PATCH-DOC"]
        assert correction.content["events"][0]["new"] == "ndarray:7.0"

        endpoint.close()
        await endpoint.task

    async def test_kernel_arrays_reach_the_view_as_comm_buffers(self) -> None:
        context = context_for(FunctionHandler(binary_app))
        endpoint, comm, client = await connected(context)
        assert endpoint.session is not None
        source = endpoint.session.document.get_model_by_name("source")

        # A later cell streams and patches binary data directly.
        source.stream({"x": np.array([10.0, 20.0])})
        source.patch({"x": [(0, 100.0)]})
        source.data = {"x": np.linspace(0, 1, 5)}

        messages = [message for message in comm.messages() if message.msgtype == "PATCH-DOC"]
        assert any(message.buffers for message in messages)
        for data, buffers in comm.sent:
            _, _, buffer_ids = Message.decode(data["envelope"])
            assert len(buffers) == len(buffer_ids)
        for message in messages:
            client.apply_json_patch(Serialized(message.content, message.buffers))
        np.testing.assert_array_equal(client.get_model_by_name("source").data["x"], np.linspace(0, 1, 5))

        endpoint.close()
        await endpoint.task

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
