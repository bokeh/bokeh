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
import copy
import json
from array import array as TypedArray
from collections.abc import Callable, Iterator
from dataclasses import dataclass
from math import inf, nan
from typing import Any

import numpy as np
import pytest
from jsonschema import Draft202012Validator

from bokeh.core.has_props import _default_resolver
from bokeh.core.json_encoder import serialize_json
from bokeh.core.properties import (
    Instance,
    Int,
    List,
    Nullable,
    Override,
    String,
)
from bokeh.document import Document
from bokeh.document.events import (
    ColumnDataChangedEvent,
    ColumnsPatchedEvent,
    ColumnsStreamedEvent,
    MessageSentEvent,
    ModelChangedEvent,
    RootAddedEvent,
    RootRemovedEvent,
    TitleChangedEvent,
)
from bokeh.embed import (
    EmbedResult,
    ExtensionRequirement,
    ResourceAssetRequirement,
    ResourceRequirements,
    embed,
    embed_server,
)
from bokeh.events import Tap
from bokeh.model import DataModel
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    DataTable,
    Div,
    Range1d,
    Slider,
    TableColumn,
)
from bokeh.plotting import figure
from bokeh.protocol import Message, messages
from tests.support.util.schemas import (
    protocol_errors,
    protocol_schema,
    validate_protocol,
)

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

@dataclass
class _Point:
    x: float
    y: float

@pytest.fixture
def data_models() -> Iterator[tuple[type[DataModel], type[DataModel]]]:
    class SchemaBase(DataModel):
        a = Int(1)
        b = Nullable(String)

    class SchemaDerived(SchemaBase):
        a = Override(default=2)
        c = List(Instance(SchemaBase))

    try:
        yield SchemaBase, SchemaDerived
    finally:
        _default_resolver.remove(SchemaDerived)
        _default_resolver.remove(SchemaBase)

@pytest.fixture
def document(data_models: tuple[type[DataModel], type[DataModel]]) -> Document:
    SchemaBase, SchemaDerived = data_models

    source = ColumnDataSource(data=dict(
        x=np.array([1, 2, 3]),
        y=[1.5, nan, inf],
        s=np.array(["a", "b", "c"]),
        m=np.ma.masked_array(["a", "b", "c"], mask=[0, 1, 0]),
        z=np.zeros((3, 2), dtype=np.float32),
        b=np.array([True, False, True]),
    ))
    plot = figure(width=200, height=200, tools=None)
    plot.scatter("x", "y", source=source, size=10, color="red")
    plot.circle(x="x", y=1, radius=3, radius_units="screen", source=source)
    plot.js_on_event("tap", CustomJS(code=""))
    plot.js_on_change("width", CustomJS(code=""))

    shared = SchemaBase(b="shared")
    plot.tags = [
        {1: 2},
        {"a": {1, 2}, "b": set()},
        {},
        (1, 2),
        b"xy",
        TypedArray("f", [1.0, 2.0]),
        slice(1, None),
        -inf,
        _Point(1, 2),
        SchemaDerived(c=[shared, shared, SchemaBase()]),
    ]

    doc = Document()
    doc.add_root(plot)
    doc.add_root(DataTable(source=source, columns=[TableColumn(field="x")]))
    doc.on_event("document_ready", CustomJS(code=""))
    return doc

def _json(value: Any) -> Any:
    return json.loads(serialize_json(value))

def _empty_document() -> Any:
    return _json(Document().to_json(deferred=False))

def _message_json(message: Message[Any]) -> Any:
    return json.loads(message.envelope_json)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_schema_is_valid() -> None:
    schema = protocol_schema()
    Draft202012Validator.check_schema(schema)
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert schema["$id"] == "https://docs.bokeh.org/en/latest/schemas/protocol.json"

@pytest.mark.parametrize("to_json", [
    lambda doc: _json(doc.to_json(deferred=False)),
    lambda doc: _json(doc.to_static_json(deferred=False)),
    lambda doc: _json(doc.to_json()),
    lambda doc: _json(doc.to_static_json()),
], ids=["full", "static", "full-deferred", "static-deferred"])
def test_document(document: Document, to_json: Callable[[Document], Any]) -> None:
    doc_json = to_json(document)
    assert "defs" in doc_json and "callbacks" in doc_json
    validate_protocol(doc_json)

@pytest.mark.parametrize("message", [
    lambda doc: messages.ack(),
    lambda doc: messages.ok("p1"),
    lambda doc: messages.error("p1", "error"),
    lambda doc: messages.error("p1", "error", traceback="traceback"),
    lambda doc: messages.pull_doc_req(),
    lambda doc: messages.pull_doc_reply("p1", doc),
    lambda doc: messages.push_doc(doc),
    lambda doc: messages.sync(),
], ids=["ACK", "OK", "ERROR", "ERROR-traceback", "PULL-DOC-REQ", "PULL-DOC-REPLY", "PUSH-DOC", "SYNC"])
def test_message(document: Document, message: Callable[[Document], Message[Any]]) -> None:
    validate_protocol(_message_json(message(document)))

def test_patch_doc_message(document: Document) -> None:
    document.to_json()  # mark all models as synced

    plot, table = document.roots
    source = table.source
    root = Div(text="new root")
    document.add_root(root)

    events = [
        ModelChangedEvent(document, plot, "x_range", Range1d(start=2, end=3)),
        ModelChangedEvent(document, plot, "width", 300, callback_policy=("throttle", 100)),
        ColumnDataChangedEvent(document, source, "data", cols=["x"]),
        ColumnsStreamedEvent(document, source, "data", dict(x=np.array([4]), y=[4.5]), 10),
        ColumnsPatchedEvent(document, source, "data", dict(x=[(0, 5), (slice(0, 1), [6])], z=[((0, slice(0, 2)), [7, 8])])),
        TitleChangedEvent(document, "title"),
        MessageSentEvent(document, "bokeh_event", Tap(plot, x=1, y=2)),
        RootAddedEvent(document, root),
        RootRemovedEvent(document, table),
    ]
    message = _message_json(messages.patch_doc(events))

    assert len(message["buffers"]) != 0
    assert {event["kind"] for event in message["content"]["events"]} == {
        "ModelChanged", "ColumnDataChanged", "ColumnsStreamed", "ColumnsPatched",
        "TitleChanged", "MessageSent", "RootAdded", "RootRemoved",
    }
    validate_protocol(message)

def test_embed_payload(document: Document) -> None:
    plot, table = document.roots
    document.remove_root(plot)
    document.remove_root(table)

    validate_protocol(embed(plot).to_dict())
    validate_protocol(embed({"plot": plot, "table": table, "div": Div(text="text")}, metadata={"host": {"a": 1}}).to_dict())
    validate_protocol(embed([Slider(start=0, end=1, value=0), Div(text="text")]).to_dict())

def test_embed_payload_with_extensions() -> None:
    requirements = ResourceRequirements(("bokeh/core", "bokeh/widgets"), (
        ExtensionRequirement("extension", (
            ResourceAssetRequirement("script", url="https://example.com/extension.js", integrity="sha384-x", crossorigin="anonymous", module=True),
            ResourceAssetRequirement("style", content="div {}"),
            ResourceAssetRequirement("script", package="extension"),
        )),
    ))
    payload = embed(Div(text="text")).to_dict()
    result = EmbedResult(source=payload["source"], roots=embed(Div(text="text")).roots, requires=requirements)
    validate_protocol(result.to_dict())

@pytest.mark.parametrize("kwargs", [
    dict(),
    dict(url="/app", token="token"),
    dict(
        url="https://example.com/app", session_id="session", roots={"a": "p1", "b": "p2"},
        arguments={"name": "value"}, headers={"Name": "value"}, with_credentials=True, relative_urls=True,
    ),
], ids=["default", "relative-token", "absolute-session"])
def test_embed_server_payload(kwargs: dict[str, Any]) -> None:
    validate_protocol(embed_server(**kwargs).to_dict())

def _mutate(path: list[str | int], value: Any) -> Callable[[Any], None]:
    def mutate(instance: Any) -> None:
        *parents, last = path
        for key in parents:
            instance = instance[key]
        if value is _DELETE:
            del instance[last]
        else:
            instance[last] = value
    return mutate

_DELETE = object()

@pytest.mark.parametrize("make, mutate", [
    # messages
    (lambda: _message_json(messages.ack()), _mutate(["header", "msgtype"], "EVENT")),
    (lambda: _message_json(messages.ack()), _mutate(["header", "extra"], 1)),
    (lambda: _message_json(messages.ack()), _mutate(["buffers"], _DELETE)),
    (lambda: _message_json(messages.ack()), _mutate(["content", "extra"], 1)),
    (lambda: _message_json(messages.ok("p1")), _mutate(["header", "reqid"], _DELETE)),
    (lambda: _message_json(messages.error("p1", "error")), _mutate(["content", "text"], _DELETE)),
    (lambda: _message_json(messages.push_doc(Document())), _mutate(["content", "doc"], _DELETE)),
    (lambda: _message_json(messages.patch_doc([TitleChangedEvent(Document(), "title")])), _mutate(["content", "events"], [])),
    (lambda: _message_json(messages.patch_doc([TitleChangedEvent(Document(), "title")])), _mutate(["content", "events", 0, "kind"], "Unknown")),
    # documents and values
    (_empty_document, _mutate(["roots"], _DELETE)),
    (_empty_document, _mutate(["extra"], 1)),
    (_empty_document, _mutate(["roots"], [{"type": "object", "name": "Div", "id": "p1", "attributes": {}}])),
    (_empty_document, _mutate(["roots"], [{"$type": "Div", "text": {"key": "plain object"}}])),
    (_empty_document, _mutate(["roots"], [{"$type": "Div", "width": {"type": "number", "value": "inf"}}])),
    (_empty_document, _mutate(["roots"], [{"$type": "Div", "text": {"type": "unknown"}}])),
    (_empty_document, _mutate(["roots"], [{"$type": "Div", "tags": [{"type": "ndarray", "array": [], "dtype": "int64", "order": "little", "shape": [0]}]}])),
    (_empty_document, _mutate(["roots"], [{"$type": "Div", "tags": [{"$ref": "p1", "extra": 1}]}])),
    (_empty_document, _mutate(["defs"], [{"type": "model", "name": "M", "properties": [{"name": "p", "kind": ["Regex", "a", "b"]}]}])),
    # embed payloads
    (lambda: embed(Div()).to_dict(), _mutate(["schema"], "bokeh.embed/v2")),
    (lambda: embed(Div()).to_dict(), _mutate(["buffers"], [])),
    (lambda: embed(Div()).to_dict(), _mutate(["roots", 0], {"key": "root", "model_id": "p1"})),
    (lambda: embed(Div()).to_dict(), _mutate(["roots", 0, "document"], 1)),
    (lambda: embed(Div()).to_dict(), _mutate(["requires", "components"], ["bokeh/unknown"])),
    (lambda: embed(Div()).to_dict(), _mutate(["requires", "extensions"], [{"name": "e", "assets": [{"kind": "script", "url": "u", "content": "c"}]}])),
    (lambda: embed(Div()).to_dict(), _mutate(["requires", "extensions"], [{"name": "e", "assets": [{"kind": "script", "url": "u", "nonce": "n"}]}])),
    (lambda: embed(Div()).to_dict(), _mutate(["requires", "extensions"], [{"name": "e", "assets": [{"kind": "style", "package": "p"}]}])),
    (lambda: embed_server("/app").to_dict(), _mutate(["source", "url"], "/app?a=1")),
    (lambda: embed_server("/app").to_dict(), _mutate(["source", "url"], "//example.com/app")),
    (lambda: embed_server("/app").to_dict(), _mutate(["source", "url"], "ftp://example.com/app")),
    (lambda: embed_server("/app", session_id="session").to_dict(), _mutate(["source", "token"], "token")),
    (lambda: embed_server("/app").to_dict(), _mutate(["source", "credentials"], "always")),
    (lambda: embed_server("/app").to_dict(), _mutate(["roots"], [{"key": "root", "document": 0, "root": 0}])),
])
def test_invalid_payload(make: Callable[[], Any], mutate: Callable[[Any], None]) -> None:
    instance = make()
    assert protocol_errors(instance) == []

    invalid = copy.deepcopy(instance)
    mutate(invalid)
    assert protocol_errors(invalid) != []

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
