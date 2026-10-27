#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
"""Retained synchronization behavior across real ASGI WebSocket connections."""

from __future__ import annotations

# Standard library imports
import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any

# External imports
import numpy as np
import pytest
from websockets.sync.client import connect

# Bokeh imports
from bokeh.core.serialization import Serialized
from bokeh.document import Document
from bokeh.layouts import column
from bokeh.models import Button, ColumnDataSource, Div, Slider
from bokeh.plotting import figure
from bokeh.protocol import apply_patch, patch_doc, pull_doc_req
from bokeh.protocol.receiver import Receiver
from bokeh.server.asgi import BokehASGI
from bokeh.util.token import generate_jwt_token, generate_session_id

# Bokeh test imports
from tests.integration.server_e2e.test_examples import browser as browser_fixture
from tests.support.util.asgi import running_asgi

browser = browser_fixture


def receive(socket):
    receiver = Receiver()
    while (message := receiver.consume(socket.recv(timeout=10))) is None:
        pass
    return message


def send(socket, message):
    for fragment, _binary in message.fragments():
        socket.send(fragment)


@pytest.mark.skipif(os.environ.get("BOKEH_SERVER_E2E") != "1", reason="Requires BOKEH_SERVER_E2E=1")
def test_two_browsers_share_updates_without_echoing_them(browser: Any) -> None:
    def application(doc):
        value = Slider(name="value", start=0, end=10, value=0)
        changes = Div(name="changes", text="0")
        button = Button(label="Server update")

        def changed(attr, old, new):
            changes.text = str(int(changes.text) + 1)

        def server_update():
            value.value += 1

        value.on_change("value", changed)
        button.on_click(server_update)
        doc.add_root(column(value, changes, button))

    # Separate browser contexts share only the explicitly selected server session.
    with running_asgi(BokehASGI(application)) as host, browser.new_context() as first, browser.new_context() as second:
        pages = [first.new_page(), second.new_page()]
        received: list[list[int]] = [[], []]
        sent: list[list[int]] = [[], []]
        errors: list[str] = []

        def record(payload, values):
            if not isinstance(payload, str):
                return
            message = json.loads(payload)
            if message["header"]["msgtype"] == "PATCH-DOC":
                values.extend(event["new"] for event in message["content"]["events"] if event.get("attr") == "value")

        session_id = generate_session_id()
        def observe(socket, incoming, outgoing):
            socket.on("framereceived", lambda payload: record(payload, incoming))
            socket.on("framesent", lambda payload: record(payload, outgoing))

        for page, incoming, outgoing in zip(pages, received, sent):
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("websocket", lambda socket, incoming=incoming, outgoing=outgoing: observe(socket, incoming, outgoing))
            page.goto(f"{host.url}/?bokeh-session-id={session_id}")
            page.wait_for_function("window.Bokeh && Bokeh.documents.length === 1")

        for origin, value in [(0, 1), (1, 2)]:
            pages[origin].evaluate("value => Bokeh.documents[0].get_model_by_name('value').value = value", value)
            for page in pages:
                page.wait_for_function("value => Bokeh.documents[0].get_model_by_name('value').value === value && "
                                       "Bokeh.documents[0].get_model_by_name('changes').text === String(value)", arg=value)

        # A Python callback must broadcast its own change to both connections.
        pages[0].get_by_role("button", name="Server update").click()
        for page in pages:
            page.wait_for_function("Bokeh.documents[0].get_model_by_name('value').value === 3 && "
                                   "Bokeh.documents[0].get_model_by_name('changes').text === '3'")
        assert received == [[2, 3], [1, 3]]
        assert sent == [[1], [2]]
        assert errors == []


def test_large_binary_patch_reaches_other_client_without_echo() -> None:
    values = np.arange(300_000, dtype=np.float64)

    def application(doc):
        doc.add_root(ColumnDataSource(name="series", data=dict(x=values)))

    token = generate_jwt_token(generate_session_id())
    with running_asgi(BokehASGI(application)) as host:
        endpoint = host.url.replace("http:", "ws:") + "/ws"
        with (
            connect(endpoint, subprotocols=["bokeh", token], max_size=8 * 1024**2) as origin,
            connect(endpoint, subprotocols=["bokeh", token], max_size=8 * 1024**2) as peer,
        ):
            documents = []
            for socket in (origin, peer):
                assert receive(socket).msgtype == "ACK"
                request = pull_doc_req()
                send(socket, request)
                reply = receive(socket)
                assert reply.header["reqid"] == request.header["msgid"]
                assert sum(len(buffer.to_bytes()) for buffer in reply.buffers) >= values.nbytes
                documents.append(Document.from_json(Serialized(reply.content["doc"], reply.buffers)))
                np.testing.assert_array_equal(documents[-1].get_model_by_name("series").data["x"], values)

            events = []
            documents[0].on_change(events.append)
            updated = values + 7
            documents[0].get_model_by_name("series").data = dict(x=updated)
            message = patch_doc(events)
            assert sum(len(buffer.to_bytes()) for buffer in message.buffers) >= updated.nbytes
            send(origin, message)
            received = receive(peer)
            assert received.msgtype == "PATCH-DOC"
            apply_patch(received, documents[1])
            np.testing.assert_array_equal(documents[1].get_model_by_name("series").data["x"], updated)

            acknowledgement = receive(origin)
            assert acknowledgement.msgtype == "OK"
            assert acknowledgement.header["reqid"] == message.header["msgid"]

            # A pull is an ordered fence, so an echoed patch cannot hide behind a timeout.
            request = pull_doc_req()
            send(origin, request)
            reply = receive(origin)
            assert reply.msgtype == "PULL-DOC-REPLY"
            assert reply.header["reqid"] == request.header["msgid"]
            server_document = Document.from_json(Serialized(reply.content["doc"], reply.buffers))
            np.testing.assert_array_equal(server_document.get_model_by_name("series").data["x"], updated)


def test_pipelined_large_replies_to_concurrent_connections() -> None:
    values = np.arange(300_000, dtype=np.float64)

    def application(doc):
        doc.add_root(ColumnDataSource(name="series", data=dict(x=values)))

    token = generate_jwt_token(generate_session_id())
    with running_asgi(BokehASGI(application)) as host:
        endpoint = host.url.replace("http:", "ws:") + "/ws"

        def client(_):
            with connect(endpoint, subprotocols=["bokeh", token], max_size=8 * 1024**2) as socket:
                assert receive(socket).msgtype == "ACK"
                requests = [pull_doc_req() for _ in range(6)]
                for request in requests:
                    send(socket, request)
                for request in requests:
                    reply = receive(socket)
                    assert reply.msgtype == "PULL-DOC-REPLY"
                    assert reply.header["reqid"] == request.header["msgid"]
                    document = Document.from_json(Serialized(reply.content["doc"], reply.buffers))
                    np.testing.assert_array_equal(document.get_model_by_name("series").data["x"], values)

        with ThreadPoolExecutor(max_workers=3) as executor:
            list(executor.map(client, range(3)))


@pytest.mark.skipif(os.environ.get("BOKEH_SERVER_E2E") != "1", reason="Requires BOKEH_SERVER_E2E=1")
def test_browser_edits_and_periodic_binary_updates_converge(browser: Any) -> None:
    values = np.arange(1024, dtype=np.float64)

    def application(doc):
        left = Slider(name="left", start=0, end=30, value=0)
        right = Slider(name="right", start=0, end=30, value=0)
        ticks = Div(name="ticks", text="0")
        source = ColumnDataSource(name="series", data=dict(x=values, y=values))
        plot = figure(width=250, height=150)
        plot.line("x", "y", source=source)
        doc.add_root(column(left, right, ticks, plot))
        started = False
        count = 0

        def publish():
            nonlocal count
            count += 1
            source.data = dict(x=values + count, y=values - count)
            ticks.text = str(count)
            if count == 30:
                doc.remove_periodic_callback(callback)

        def start(attr, old, new):
            nonlocal started, callback
            if not started and left.value > 0 and right.value > 0:
                started = True
                callback = doc.add_periodic_callback(publish, 5)

        callback = None
        left.on_change("value", start)
        right.on_change("value", start)

    with running_asgi(BokehASGI(application)) as host, browser.new_context() as first, browser.new_context() as second:
        pages = [first.new_page(), second.new_page()]
        errors: list[str] = []
        session_id = generate_session_id()
        for page in pages:
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{host.url}/?bokeh-session-id={session_id}")
            page.wait_for_function("window.Bokeh && Bokeh.documents.length === 1")
        for page, side in zip(pages, ("left", "right")):
            page.evaluate("""side => {
                let value = 0;
                const timer = setInterval(() => {
                    Bokeh.documents[0].get_model_by_name(side).value = ++value;
                    if (value === 30) clearInterval(timer);
                }, 10);
            }""", side)
        for page in pages:
            page.wait_for_function("""() => {
                const doc = Bokeh.documents[0];
                return doc.get_model_by_name('left').value === 30 &&
                       doc.get_model_by_name('right').value === 30 &&
                       doc.get_model_by_name('ticks').text === '30' &&
                       doc.get_model_by_name('series').data.x[0] === 30 &&
                       doc.get_model_by_name('series').data.y[1023] === 993;
            }""")
        assert errors == []
