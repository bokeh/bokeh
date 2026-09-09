#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

from __future__ import annotations

# Module under test
import bokeh.embed.util as beu # isort:skip


def test_from_curdoc_is_a_sentinel_type() -> None:
    assert isinstance(beu.FromCurdoc, type)


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
