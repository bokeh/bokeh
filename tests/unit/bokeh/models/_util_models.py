#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2023, Anaconda, Inc., and Bokeh Contributors.
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
from itertools import chain
from typing import TYPE_CHECKING

# Bokeh imports
from bokeh.core.enums import LineCap, LineJoin, NamedColor as Color
from bokeh.core.property.vectorization import value

if TYPE_CHECKING:
    from bokeh.core.has_props import HasProps

# Module under test
 # isort:skip
#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# enums
FILL  = ["fill_color", "fill_alpha"]
HATCH = ["hatch_color", "hatch_alpha", "hatch_scale", "hatch_pattern", "hatch_weight", "hatch_extra"]
LINE  = ["line_color", "line_width", "line_alpha", "line_join", "line_cap", "line_dash", "line_dash_offset"]
TEXT  = ["text_font", "text_font_size", "text_font_style", "text_color", "text_outline_color",
         "text_alpha", "text_align", "text_baseline", "text_line_height"]

HOVER_FILL  = [f"hover_{name}" for name in FILL]
HOVER_HATCH = [f"hover_{name}" for name in HATCH]
HOVER_LINE  = [f"hover_{name}" for name in LINE]
HOVER_TEXT  = [f"hover_{name}" for name in TEXT]

ABOVE_FILL  = [f"above_{name}" for name in FILL]
ABOVE_HATCH = [f"above_{name}" for name in HATCH]

BELOW_FILL  = [f"below_{name}" for name in FILL]
BELOW_HATCH = [f"below_{name}" for name in HATCH]

BORDER_LINE = [f"border_{name}" for name in LINE]

BACKGROUND_FILL  = [f"background_{name}" for name in FILL]
BACKGROUND_HATCH = [f"background_{name}" for name in HATCH]

ANGLE = ["angle", "angle_units"]

PROPS = ["name", "tags", "js_property_callbacks", "js_event_callbacks", "subscribed_events", "syncable"]
GLYPH = ["decorations"]

MARKER = ["x", "y", "size", "angle", "angle_units", "hit_dilation"]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def prefix(prefix: str, props: list[str]) -> list[str]:
    return [prefix + p for p in props]

def check_properties_existence(model: HasProps, *props: list[str]) -> None:
    expected = set(chain(PROPS, *props))
    found = set(model.properties())
    missing = expected.difference(found)
    extra = found.difference(expected)
    assert len(missing) == 0, f"Properties missing: {', '.join(sorted(missing))}"
    assert len(extra) == 0, f"Extra properties: {', '.join(sorted(extra))}"

def check_fill_properties(model: HasProps, prefix: str = "", fill_color: str | None = Color.gray, fill_alpha: float = 1.0) -> None:
    assert getattr(model, prefix + "fill_color") == fill_color
    assert getattr(model, prefix + "fill_alpha") == fill_alpha

def check_hatch_properties(model: HasProps, prefix: str = "", hatch_color: str | None = Color.black, hatch_alpha: float = 1.0,
        hatch_pattern: str | None = None, hatch_scale: float = 12.0, hatch_weight: float = 1.0, hatch_extra: dict[str, str] = {}) -> None:
    assert getattr(model, prefix + "hatch_color") == hatch_color
    assert getattr(model, prefix + "hatch_alpha") == hatch_alpha
    assert getattr(model, prefix + "hatch_pattern") == hatch_pattern
    assert getattr(model, prefix + "hatch_scale") == hatch_scale
    assert getattr(model, prefix + "hatch_weight") == hatch_weight
    assert getattr(model, prefix + "hatch_extra") == hatch_extra

def check_line_properties(model: HasProps, prefix: str = "", line_color: str | None = Color.black, line_width: float = 1.0, line_alpha: float = 1.0) -> None:
    assert getattr(model, prefix + "line_color") == line_color
    assert getattr(model, prefix + "line_width") == line_width
    assert getattr(model, prefix + "line_alpha") == line_alpha
    assert getattr(model, prefix + "line_join") == LineJoin.bevel
    assert getattr(model, prefix + "line_cap") == LineCap.butt
    assert getattr(model, prefix + "line_dash") == []
    assert getattr(model, prefix + "line_dash_offset") == 0

def check_text_properties(model: HasProps, prefix: str = "", font_size: str = '16px', baseline: str = 'bottom',
        font_style: str = 'normal', align: str = "left", scalar: bool = False) -> None:
    text_font = getattr(model, prefix + "text_font")
    text_font_size = getattr(model, prefix + "text_font_size")
    text_font_style = getattr(model, prefix + "text_font_style")
    text_color = getattr(model, prefix + "text_color")
    text_outline_color = getattr(model, prefix + "text_outline_color")
    text_alpha = getattr(model, prefix + "text_alpha")
    text_align = getattr(model, prefix + "text_align")
    text_baseline = getattr(model, prefix + "text_baseline")

    if scalar:
        assert text_font == "helvetica"
        assert text_font_size == font_size
        assert text_font_style == font_style
        assert text_color == "#444444"
        assert text_outline_color is None
        assert text_alpha == 1.0
        assert text_align == align
        assert text_baseline == baseline
    else:
        assert text_font == value("helvetica")
        assert text_font_size == value(font_size)
        assert text_font_style == font_style
        assert text_color == "#444444"
        assert text_outline_color is None
        assert text_alpha == 1.0
        assert text_align == align
        assert text_baseline == baseline

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
