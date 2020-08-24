#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import pytest ; pytest

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports
from itertools import chain

# Bokeh imports
from bokeh.core.enums import LineCap, LineJoin
from bokeh.core.enums import NamedColor as Color
from bokeh.core.property.dataspec import field

# Module under test
 # isort:skip
#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

# enums
FILL  = ["fill_color", "fill_alpha"]
HATCH = ["hatch_color", "hatch_alpha", "hatch_scale", "hatch_pattern", "hatch_weight", "hatch_extra"]
LINE  = ["line_color", "line_width", "line_alpha", "line_join", "line_cap", "line_dash", "line_dash_offset"]
TEXT  = ["text_font", "text_font_size", "text_font_style", "text_color", "text_alpha", "text_align", "text_baseline", "text_line_height"]

ANGLE = ["angle", "angle_units"]

PROPS = ["name", "tags", "js_property_callbacks", "js_event_callbacks", "subscribed_events"]
GLYPH = []

MARKER = ["x", "y", "size", "angle", "angle_units"]

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def prefix(prefix, props):
    return [prefix + p for p in props]

def check_properties_existence(model, *props):
    expected = set(chain(PROPS, *props))
    found = set(model.properties())
    missing = expected.difference(found)
    extra = found.difference(expected)
    assert len(missing) == 0, "Properties missing: {0}".format(", ".join(sorted(missing)))
    assert len(extra) == 0, "Extra properties: {0}".format(", ".join(sorted(extra)))

def check_fill_properties(model, prefix="", fill_color=Color.gray, fill_alpha=1.0):
    assert getattr(model, prefix + "fill_color") == fill_color
    assert getattr(model, prefix + "fill_alpha") == fill_alpha

def check_hatch_properties(model, prefix="", hatch_color=Color.black, hatch_alpha=1.0, hatch_pattern=None, hatch_scale=12.0, hatch_weight=1.0, hatch_extra={}):
    assert getattr(model, prefix + "hatch_color") == hatch_color
    assert getattr(model, prefix + "hatch_alpha") == hatch_alpha
    assert getattr(model, prefix + "hatch_pattern") == hatch_pattern
    assert getattr(model, prefix + "hatch_scale") == hatch_scale
    assert getattr(model, prefix + "hatch_weight") == hatch_weight
    assert getattr(model, prefix + "hatch_extra") == hatch_extra

def check_line_properties(model, prefix="", line_color=Color.black, line_width=1.0, line_alpha=1.0):
    assert getattr(model, prefix + "line_color") == line_color
    assert getattr(model, prefix + "line_width") == line_width
    assert getattr(model, prefix + "line_alpha") == line_alpha
    assert getattr(model, prefix + "line_join") == LineJoin.bevel
    assert getattr(model, prefix + "line_cap") == LineCap.butt
    assert getattr(model, prefix + "line_dash") == []
    assert getattr(model, prefix + "line_dash_offset") == 0

def check_text_properties(model, prefix="", font_size='16px', baseline='bottom', font_style='normal', align="left", scalar=False):
    assert getattr(model, prefix + "text_font") == "helvetica"
    if scalar:
        assert getattr(model, prefix + "text_font_size") == font_size
    else:
        assert getattr(model, prefix + "text_font_size") == {"value": font_size}
    assert getattr(model, prefix + "text_font_style") == font_style
    assert getattr(model, prefix + "text_color") == "#444444"
    assert getattr(model, prefix + "text_alpha") == 1.0
    assert getattr(model, prefix + "text_align") == align
    assert getattr(model, prefix + "text_baseline") == baseline

def check_marker_properties(marker):
    assert marker.x == field("x")
    assert marker.y == field("y")
    assert marker.size == 4

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
