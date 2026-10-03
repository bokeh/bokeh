#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# External imports
import pytest

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


@pytest.mark.parametrize("value", [float("nan"), float("inf"), float("-inf"), 2**53, float(2**53), 1e20, 1e21])
def test_canonical_embed_json_rejects_numbers_javascript_cannot_fingerprint(value: float | int) -> None:
    with pytest.raises(ValueError, match=r"finite|safe integer"):
        beu.canonical_embed_json(value)


@pytest.mark.parametrize("value", [{1: "value"}, {1, 2}, b"value"])
def test_canonical_embed_json_rejects_non_json_values(value: object) -> None:
    with pytest.raises(TypeError):
        beu.canonical_embed_json(value)

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
