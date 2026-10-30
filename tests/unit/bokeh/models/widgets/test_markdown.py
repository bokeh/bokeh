#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
from __future__ import annotations

from typing import Any

import pytest

from bokeh.core.property.validation import validate
from bokeh.core.serialization import Deserializer, Serializer
from bokeh.embed.resources import use_mathjax
from bokeh.models import Markdown, Plot, Range1d


class MarkdownResult:
    def __init__(self, result: Any) -> None:
        self.result = result
        self.calls = 0

    def _repr_markdown_(self) -> Any:
        self.calls += 1
        return self.result


def test_representations_without_property_validation() -> None:
    obj = MarkdownResult(("**Results**", {}))
    with validate(False):
        markdown = Markdown(text=obj)
        assert markdown.text == "**Results**"
        assert obj.calls == 1
        markdown.text = None
        assert markdown.text == ""
        obj.result = "Updated"
        markdown.text = obj
        assert markdown.text == "Updated"
        assert obj.calls == 2


@pytest.mark.parametrize("result, expected", [
    ("**Results**", "**Results**"),
    (("# Results", {"custom": "metadata"}), "# Results"),
    (None, ""),
])
def test_markdown_representations(result: Any, expected: str) -> None:
    obj = MarkdownResult(result)
    markdown = Markdown(text=obj)
    assert markdown.text == expected
    assert obj.calls == 1
    restored = Deserializer().decode(Serializer().encode(markdown))
    assert restored.text == expected
    assert obj.calls == 1

    changes = []
    markdown.on_change("text", lambda attr, old, new: changes.append(new))
    obj.result = "Updated"
    assert markdown.text == expected
    markdown.text = obj
    assert markdown.text == "Updated"
    assert changes == ["Updated"]
    assert obj.calls == 2

    restored = Deserializer().decode(Serializer().encode(markdown))
    assert restored.text == "Updated"
    assert obj.calls == 2


def test_strings_and_none() -> None:
    markdown = Markdown(text="Unchanged")
    assert markdown.text == "Unchanged"
    markdown.text = None
    assert markdown.text == ""
    assert Markdown(text=None).text == ""


def test_string_subclasses_do_not_call_markdown_representation() -> None:
    class Text(str):
        def _repr_markdown_(self) -> str:
            raise AssertionError("string inputs must be preserved")

    assert Markdown(text=Text("Original")).text == "Original"


def test_representation_math_resources() -> None:
    markdown = Markdown(text=MarkdownResult("$$x^2$$"))
    assert use_mathjax({markdown})


@pytest.mark.parametrize("result", [42, ["text"], ("text",), ("text", {}, "extra"), ("text", []), (None, {})])
def test_invalid_markdown_representations(result: Any) -> None:
    obj = MarkdownResult(result)
    markdown = Markdown(text="Original")
    with pytest.raises(ValueError, match="_repr_markdown_"):
        markdown.text = obj
    assert markdown.text == "Original"
    assert obj.calls == 1


@pytest.mark.parametrize("value", [42, object(), {"text": "value"}])
def test_objects_without_markdown_representation(value: Any) -> None:
    with pytest.raises(ValueError, match="callable _repr_markdown_"):
        Markdown(text=value)


def test_markdown_representation_exception() -> None:
    class Broken:
        def _repr_markdown_(self) -> str:
            raise RuntimeError("representation failed")

    markdown = Markdown(text="Original")
    with pytest.raises(RuntimeError, match="representation failed"):
        markdown.text = Broken()
    assert markdown.text == "Original"


def test_embedded_models_roundtrip() -> None:
    plot = Plot(x_range=Range1d(start=0, end=10), y_range=Range1d(start=0, end=10))
    markdown = Markdown(text=MarkdownResult(("::bokeh[trend]", {"ignored": object()})), embeds={"trend": plot, "alias": plot})

    restored = Deserializer().decode(Serializer().encode(markdown))

    assert isinstance(restored, Markdown)
    embedded = restored.embeds["trend"]
    assert isinstance(embedded, Plot)
    assert restored.embeds["alias"] is embedded
    assert embedded in restored.references()
    assert embedded.x_range.start == 0
    assert embedded.x_range.end == 10


def test_rendering_options_roundtrip() -> None:
    markdown = Markdown(text="    First\n    Second", dedent=False, hard_line_break=True, disable_anchors=True)
    restored = Deserializer().decode(Serializer().encode(markdown))

    assert restored.text == markdown.text
    assert restored.dedent is False
    assert restored.hard_line_break is True
    assert restored.disable_anchors is True


@pytest.mark.parametrize("name", ["", "bad name", "bad]name", "é", "name\n"])
def test_invalid_embed_names(name: str) -> None:
    with pytest.raises(ValueError):
        Markdown(embeds={name: Plot()})


def test_valid_embed_names() -> None:
    model = Plot()
    markdown = Markdown(embeds={"trend_1.a-b": model})
    assert markdown.embeds == {"trend_1.a-b": model}
