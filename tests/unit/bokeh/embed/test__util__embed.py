#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Standard library imports
from threading import Event, Thread, current_thread

# External imports
import pytest

# Bokeh imports
from bokeh.document import Document
from bokeh.models import Button, Div
from bokeh.themes import Theme, default

# Module under test
import bokeh.embed._util as beu # isort:skip


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (None, "null"),
        (True, "true"),
        (-0.0, "0"),
        (1.0, "1"),
        (1e-6, "0.000001"),
        (1e-7, "1e-7"),
        ((1, "value"), '[1,"value"]'),
        ("\ud800", '"\\ud800"'),
        ({"\ue000": 1, "\U00010000": 2}, '{"𐀀":2,"":1}'),
    ],
)
def test_canonical_embed_json(value: object, expected: str) -> None:
    assert beu.canonical_embed_json(value) == expected


@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf"), 2**53])
def test_canonical_embed_json_rejects_non_finite_floats_and_unsafe_integers(value: float | int) -> None:
    with pytest.raises(ValueError, match=r"finite|safe integer"):
        beu.canonical_embed_json(value)


@pytest.mark.parametrize("value", [float(2**53), 1e20, 1e21, 1e22])
def test_canonical_embed_json_accepts_large_finite_floats(value: float) -> None:
    assert isinstance(beu.canonical_embed_json(value), str)


@pytest.mark.parametrize("value", [{1: "value"}, {1, 2}, b"value"])
def test_canonical_embed_json_rejects_non_json_values(value: object) -> None:
    with pytest.raises(TypeError):
        beu.canonical_embed_json(value)


def test_embed_applies_explicit_default_theme_and_restores_source() -> None:
    model = Button()
    source = Document(theme=Theme(json={"attrs": {"Button": {"button_type": "danger"}}}))
    source.add_root(model)

    result = beu.embed(model, theme=default)

    root = result.source["documents"][0]["roots"][0]
    assert root.get("button_type", "default") == "default"
    assert model.button_type == "danger"
    assert model.document is source


def test_overlapping_embeds_preserve_model_ownership(monkeypatch: pytest.MonkeyPatch) -> None:
    model = Div(text="initial")
    source = Document()
    source.add_root(model)
    first_entered = Event()
    second_started = Event()
    second_entered = Event()
    first_finished = Event()
    errors: list[BaseException] = []
    original = Document.to_static_json

    def serialize(document, *args, **kwargs):
        if current_thread().name == "first-embed":
            first_entered.set()
            assert second_started.wait(5)
            second_entered.wait(0.5)
        else:
            second_entered.set()
            assert first_finished.wait(5)
        return original(document, *args, **kwargs)

    def run() -> None:
        if current_thread().name == "second-embed":
            second_started.set()
        try:
            beu.embed(model)
        except BaseException as error:
            errors.append(error)
        finally:
            if current_thread().name == "first-embed":
                first_finished.set()

    monkeypatch.setattr(Document, "to_static_json", serialize)
    first = Thread(target=run, name="first-embed")
    second = Thread(target=run, name="second-embed")
    first.start()
    assert first_entered.wait(5)
    second.start()
    first.join(5)
    second.join(5)

    assert not first.is_alive() and not second.is_alive()
    assert errors == []
    assert model.document is source
    changes = []
    source.on_change(changes.append)
    model.text = "changed"
    assert len(changes) == 1


def test_is_tex_string() -> None:
    assert beu.is_tex_string("$$test$$") is True
    assert beu.is_tex_string("$$test$$  ") is False
    assert beu.is_tex_string("  $$test$$") is False
    assert beu.is_tex_string("\\[test\\]") is True
    assert beu.is_tex_string("\\(test\\)") is True
    assert beu.is_tex_string("test$$") is False
    assert beu.is_tex_string("$$test") is False
    assert beu.is_tex_string("$$tex$$text$$tex$$") is True
    assert beu.is_tex_string("""$$
      cos(x)
    $$""") is True


def test_contains_tex_string() -> None:
    assert beu.contains_tex_string("$$test$$") is True
    assert beu.contains_tex_string("\\[test\\]") is True
    assert beu.contains_tex_string("\\(test\\)") is True
    assert beu.contains_tex_string("HTML <b>text</b> $$sin(x)$$") is True
    assert beu.contains_tex_string("test$$") is False
    assert beu.contains_tex_string("$$test") is False
    assert beu.contains_tex_string("$$tex$$text$$tex$$") is True
