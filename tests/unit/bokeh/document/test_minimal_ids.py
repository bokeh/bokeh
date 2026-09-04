#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
import json
from copy import deepcopy
from pathlib import Path
from typing import Any, Iterator

# Bokeh imports
from bokeh.core.serialization import ObjectRep, Serializer
from bokeh.document import Document
from bokeh.document.events import ModelChangedEvent
from bokeh.models import CustomJS
from bokeh.util.version import __version__

FIXTURE_PATH = Path(__file__).parents[4] / "bokehjs" / "test" / "unit" / "document" / "minimal_ids_fixture.ts"


def _custom_js(id: str, code: str) -> CustomJS:
    callback = CustomJS._new(id)
    assert callback is not None
    callback.__init__()
    callback.code = code
    return callback


def _fixture_document() -> Document:
    shared = _custom_js("shared-callback", "shared")
    cycle_a = _custom_js("cycle-a", "cycle-a")
    cycle_b = _custom_js("cycle-b", "cycle-b")
    cycle_a.args = {"other": cycle_b}
    cycle_b.args = {"other": cycle_a}

    primary = CustomJS(code="primary", args={
        "anonymous": CustomJS(code="anonymous"),
        "shared": shared,
        "cycle": cycle_a,
    })
    primary.name = "semantic-primary"
    secondary = CustomJS(code="secondary", args={"shared": shared})

    document = Document()
    document.add_root(primary)
    document.add_root(secondary)
    return document


def _fixture_case() -> dict[str, Any]:
    fixture_source = FIXTURE_PATH.read_text()
    fixture_json = fixture_source.split("String.raw`", maxsplit=1)[1].split("`)", maxsplit=1)[0]
    fixture = json.loads(fixture_json)
    assert fixture["schema"] == "bokeh.embed.minimal-id-fixtures/v1"
    [case] = fixture["cases"]
    assert case["name"] == "keyed-static-graph"
    return case


def _object_reps(value: Any) -> Iterator[ObjectRep]:
    if isinstance(value, dict):
        if value.get("type") == "object":
            yield value
        for child in value.values():
            yield from _object_reps(child)
    elif isinstance(value, (list, tuple)):
        for child in value:
            yield from _object_reps(child)


def test_static_document_matches_shared_cross_language_fixture() -> None:
    document = _fixture_document()
    actual = document.to_static_json(deferred=False)
    actual["version"] = "__VERSION__"
    json_compatible = json.loads(json.dumps(actual))

    assert json_compatible == _fixture_case()["document"]


def test_static_document_round_trips_keyed_anonymous_shared_and_cyclic_models() -> None:
    case = _fixture_case()
    encoded = deepcopy(case["document"])
    encoded["version"] = __version__

    document = Document.from_json(encoded)
    roots = {root["key"]: document.roots[root["index"]] for root in case["roots"]}

    primary = roots["primary"]
    secondary = roots["secondary"]
    assert isinstance(primary, CustomJS)
    assert isinstance(secondary, CustomJS)

    anonymous = primary.args["anonymous"]
    shared = primary.args["shared"]
    cycle_a = primary.args["cycle"]
    assert isinstance(anonymous, CustomJS)
    assert isinstance(shared, CustomJS)
    assert isinstance(cycle_a, CustomJS)
    assert anonymous.code == "anonymous"
    assert secondary.args["shared"] is shared
    assert shared.id == "shared-callback"

    cycle_b = cycle_a.args["other"]
    assert isinstance(cycle_b, CustomJS)
    assert cycle_b.args["other"] is cycle_a
    assert cycle_a.id == "cycle-a"
    assert cycle_b.id == "cycle-b"
    assert document.get_model_by_name("semantic-primary") is primary


def test_static_anonymous_ids_are_runtime_details() -> None:
    source = _fixture_document()
    source_root_ids = [root.id for root in source.roots]

    encoded = source.to_static_json(deferred=False)
    reconstructed = Document.from_json(encoded)

    assert all(root.id != source_id for root, source_id in zip(reconstructed.roots, source_root_ids, strict=True))
    assert reconstructed.get_model_by_name("semantic-primary") is reconstructed.roots[0]


def test_static_document_is_deterministic_and_does_not_force_root_ids() -> None:
    document = _fixture_document()
    first = document.to_static_json(deferred=False)
    second = document.to_static_json(deferred=False)

    assert first == second
    assert "id" not in first["roots"][0]
    assert "id" not in first["roots"][1]

    [primary, secondary] = document.roots
    retained = document.to_static_json(deferred=False, models_with_ids=[primary])
    assert retained["roots"][0]["id"] == primary.id
    assert "id" not in retained["roots"][1]
    assert secondary.id != primary.id


def test_canonical_documents_and_patch_values_remain_id_full() -> None:
    document = _fixture_document()
    canonical = document.to_json(deferred=False)

    object_reps = list(_object_reps(canonical))
    assert object_reps
    assert all("id" in rep for rep in object_reps)

    primary = document.roots[0]
    assert document.get_model_by_id(primary.id) is primary
    replacement = CustomJS(code="replacement")
    event = ModelChangedEvent(document, primary, "args", {"replacement": replacement})
    serialized = event.to_serializable(Serializer())
    assert serialized["model"] == primary.ref
    [replacement_rep] = list(_object_reps(serialized["new"]))
    assert replacement_rep["id"] == replacement.id
