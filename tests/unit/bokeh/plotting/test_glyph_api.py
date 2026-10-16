#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
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

# Bokeh imports
from bokeh.models import (
    ColumnDataSource,
    GlyphRenderer,
    NormalHead,
    OpenHead,
    glyphs,
)
from bokeh.plotting import figure

#-----------------------------------------------------------------------------
# Setup
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

def test_annular_wedge() -> None:
    p = figure()
    gr = p.annular_wedge()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.AnnularWedge)

def test_annulus() -> None:
    p = figure()
    gr = p.annulus()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Annulus)

def test_arrow() -> None:
    p = figure()
    gr = p.arrow(x_start=[0], y_start=[1], x_end=[2], y_end=[3])
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Segment)
    assert gr.level == "annotation"
    assert gr.glyph.x0 == "x0"
    assert gr.glyph.y0 == "y0"
    assert gr.glyph.x1 == "x1"
    assert gr.glyph.y1 == "y1"
    assert gr.data_source.data == dict(x0=[0], y0=[1], x1=[2], y1=[3])
    assert len(gr.glyph.decorations) == 1
    assert gr.glyph.decorations[0].node == "end"
    assert isinstance(gr.glyph.decorations[0].marking, OpenHead)

def test_arrow_with_both_heads_and_insets() -> None:
    p = figure()
    start = NormalHead(size=10)
    end = OpenHead(size=12)
    gr = p.arrow(
        x_start=10, y_start=20, x_end=1, y_end=2,
        start=start, end=end,
        start_inset=3, end_inset=4,
    )
    assert [(decoration.node, decoration.marking, decoration.inset) for decoration in gr.glyph.decorations] == [
        ("start", start, 3),
        ("end", end, 4),
    ]

def test_arrow_uses_legacy_field_names_with_a_source() -> None:
    source = ColumnDataSource(dict(x_start=[0], y_start=[1], x_end=[2], y_end=[3]))
    gr = figure().arrow(source=source)
    assert gr.data_source is source
    assert gr.glyph.x0 == "x_start"
    assert gr.glyph.y0 == "y_start"
    assert gr.glyph.x1 == "x_end"
    assert gr.glyph.y1 == "y_end"

def test_arc() -> None:
    p = figure()
    gr = p.arc()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Arc)

def test_bezier() -> None:
    p = figure()
    gr = p.bezier()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Bezier)

def test_circle() -> None:
    p = figure()
    gr = p.circle()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Circle)

def test_block() -> None:
    p = figure()
    gr = p.block()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Block)

def test_harea() -> None:
    p = figure()
    gr = p.harea()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.HArea)

def test_harea_step() -> None:
    p = figure()
    gr = p.step()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Step)

def test_hbar() -> None:
    p = figure()
    gr = p.hbar()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.HBar)

def test_hspan() -> None:
    p = figure()
    gr = p.hspan()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.HSpan)

def test_hstrip() -> None:
    p = figure()
    gr = p.hstrip()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.HStrip)

def test_ellipse() -> None:
    p = figure()
    gr = p.ellipse()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Ellipse)

def test_hex_tile() -> None:
    p = figure()
    gr = p.hex_tile()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.HexTile)

def test_image() -> None:
    p = figure()
    gr = p.image()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Image)

def test_image_rgba() -> None:
    p = figure()
    gr = p.image_rgba()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.ImageRGBA)

def test_image_stack() -> None:
    p = figure()
    gr = p.image_stack()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.ImageStack)

def test_image_url() -> None:
    p = figure()
    gr = p.image_url()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.ImageURL)

def test_line() -> None:
    p = figure()
    gr = p.line()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Line)

def test_multi_line() -> None:
    p = figure()
    gr = p.multi_line()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.MultiLine)

def test_multi_polygons() -> None:
    p = figure()
    gr = p.multi_polygons()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.MultiPolygons)

def test_patch() -> None:
    p = figure()
    gr = p.patch()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Patch)

def test_patches() -> None:
    p = figure()
    gr = p.patches()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Patches)

def test_quad() -> None:
    p = figure()
    gr = p.quad()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Quad)

def test_quadratic() -> None:
    p = figure()
    gr = p.quadratic()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Quadratic)

def test_ray() -> None:
    p = figure()
    gr = p.ray()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Ray)

def test_rect() -> None:
    p = figure()
    gr = p.rect()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Rect)

def test_step() -> None:
    p = figure()
    gr = p.step()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Step)

def test_segment() -> None:
    p = figure()
    gr = p.segment()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Segment)

def test_text() -> None:
    p = figure()
    gr = p.text()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Text)

def test_varea() -> None:
    p = figure()
    gr = p.varea()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.VArea)

def test_varea_step() -> None:
    p = figure()
    gr = p.varea_step()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.VAreaStep)

def test_vbar() -> None:
    p = figure()
    gr = p.vbar()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.VBar)

def test_vspan() -> None:
    p = figure()
    gr = p.vspan()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.VSpan)

def test_vstrip() -> None:
    p = figure()
    gr = p.vstrip()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.VStrip)

def test_wedge() -> None:
    p = figure()
    gr = p.wedge()
    assert isinstance(gr, GlyphRenderer)
    assert isinstance(gr.glyph, glyphs.Wedge)

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
