#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2019, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models (mostly base classes) for the various kinds of renderer
types that Bokeh supports.

'''
#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import absolute_import, division, print_function, unicode_literals

from difflib import get_close_matches
import logging
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Standard library imports

# External imports

# Bokeh imports
from ..core.enums import RenderLevel
from ..core.has_props import abstract
from ..core.properties import Auto, Bool, Either, Enum, Float, Instance, Override, String
from ..core.validation import error
from ..core.validation.errors import (BAD_COLUMN_NAME, MISSING_GLYPH, NO_SOURCE_FOR_GLYPH,
                                      CDSVIEW_SOURCE_DOESNT_MATCH, MALFORMED_GRAPH_SOURCE)
from ..model import Model

from .glyphs import Glyph, Circle, MultiLine
from .graphs import LayoutProvider, GraphHitTestPolicy, NodesOnly
from .sources import ColumnDataSource, DataSource, WebSource, CDSView
from .tiles import TileSource, WMTSTileSource

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'DataRenderer',
    'GlyphRenderer',
    'GraphRenderer',
    'GuideRenderer',
    'Renderer',
    'TileRenderer',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

@abstract
class Renderer(Model):
    '''An abstract base class for renderer types.

    '''

    level = Enum(RenderLevel, help="""
    Specifies the level in which to paint this renderer.
    """)

    visible = Bool(default=True, help="""
    Is the renderer visible.
    """)

@abstract
class DataRenderer(Renderer):
    ''' An abstract base class for data renderer types (e.g. ``GlyphRenderer``, ``TileRenderer``, ``GraphRenderer``).

    '''

    level = Override(default="glyph")

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen locations when
    rendering glyphs on the plot. If unset, use the default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen locations when
    rendering glyphs on the plot. If unset, use the default y-range.
    """)

class TileRenderer(DataRenderer):
    '''

    '''

    tile_source = Instance(TileSource, default=lambda: WMTSTileSource(), help="""
    Local data source to use when rendering glyphs on the plot.
    """)

    alpha = Float(1.0, help="""
    tile opacity 0.0 - 1.0
    """)

    smoothing = Bool(default=True, help="""
    Enable image smoothing for the rendered tiles.
    """)

    render_parents = Bool(default=True, help="""
    Flag enable/disable drawing of parent tiles while waiting for new tiles to arrive. Default value is True.
    """)

class GlyphRenderer(DataRenderer):
    '''

    '''

    @error(MISSING_GLYPH)
    def _check_missing_glyph(self):
        if not self.glyph: return str(self)

    @error(NO_SOURCE_FOR_GLYPH)
    def _check_no_source_for_glyph(self):
        if not self.data_source: return str(self)

    @error(CDSVIEW_SOURCE_DOESNT_MATCH)
    def _check_cdsview_source(self):
        if self.data_source is not self.view.source: return str(self)

    @error(BAD_COLUMN_NAME)
    def _check_bad_column_name(self):
        if not self.glyph: return
        if not self.data_source: return
        if isinstance(self.data_source, WebSource): return
        missing_values = set()
        specs = self.glyph.dataspecs()
        for name, item in self.glyph.properties_with_values(include_defaults=False).items():
            if name not in specs: continue
            if not isinstance(item, dict): continue
            if not isinstance(self.data_source, ColumnDataSource): continue
            if 'field' in item and item['field'] not in self.data_source.column_names:
                missing_values.add((item['field'], name))
        if missing_values:
            suggestions = ['" (closest match: "%s")' % s[0] if s else '"' for s in [
                get_close_matches(term[0], self.data_source.column_names, n=1) for term in missing_values]]
            missing_values = [("".join([m[0], s]), m[1]) for m, s in zip(missing_values, suggestions)]
            missing = ['key "%s" value "%s' % (k, v) for v, k in missing_values]
            return "%s [renderer: %s]" % (", ".join(sorted(missing)), self)

    def __init__(self, **kw):
        super(GlyphRenderer, self).__init__(**kw)
        if "view" not in kw:
            self.view = CDSView(source=self.data_source)

    data_source = Instance(DataSource, help="""
    Local data source to use when rendering glyphs on the plot.
    """)

    view = Instance(CDSView, help="""
    A view into the data source to use when rendering glyphs. A default view
    of the entire data source is created when a view is not passed in during
    initialization.
    """)

    glyph = Instance(Glyph, help="""
    The glyph to render, in conjunction with the supplied data source
    and ranges.
    """)

    selection_glyph = Either(Auto, Instance(Glyph), default="auto", help="""
    An optional glyph used for selected points.

    If set to "auto" then the standard glyph will be used for selected
    points.
    """)

    nonselection_glyph = Either(Auto, Instance(Glyph), default="auto", help="""
    An optional glyph used for explicitly non-selected points
    (i.e., non-selected when there are other points that are selected,
    but not when no points at all are selected.)

    If set to "auto" then a glyph with a low alpha value (0.1) will
    be used for non-selected points.
    """)

    hover_glyph = Instance(Glyph, help="""
    An optional glyph used for inspected points, e.g., those that are
    being hovered over by a ``HoverTool``.
    """)

    muted_glyph = Instance(Glyph, help="""
    """)

    muted = Bool(False, help="""
    """)

_DEFAULT_NODE_RENDERER = lambda: GlyphRenderer(
    glyph=Circle(), data_source=ColumnDataSource(data=dict(index=[]))
)

_DEFAULT_EDGE_RENDERER = lambda: GlyphRenderer(
    glyph=MultiLine(), data_source=ColumnDataSource(data=dict(start=[], end=[]))
)

class GraphRenderer(DataRenderer):
    '''

    '''

    @error(MALFORMED_GRAPH_SOURCE)
    def _check_malformed_graph_source(self):
        missing = []
        if "index" not in self.node_renderer.data_source.column_names:
            missing.append("Column 'index' is missing in GraphSource.node_renderer.data_source")
        if "start" not in self.edge_renderer.data_source.column_names:
            missing.append("Column 'start' is missing in GraphSource.edge_renderer.data_source")
        if "end" not in self.edge_renderer.data_source.column_names:
            missing.append("Column 'end' is missing in GraphSource.edge_renderer.data_source")
        if missing:
            return " ,".join(missing) + " [%s]" % self

    layout_provider = Instance(LayoutProvider, help="""
    An instance of a ``LayoutProvider`` that supplies the layout of the network
    graph in cartesian space.
    """)

    node_renderer = Instance(GlyphRenderer, default=_DEFAULT_NODE_RENDERER, help="""
    Instance of a ``GlyphRenderer`` containing an ``XYGlyph`` that will be rendered
    as the graph nodes.
    """)

    edge_renderer = Instance(GlyphRenderer, default=_DEFAULT_EDGE_RENDERER, help="""
    Instance of a ``GlyphRenderer`` containing an ``MultiLine`` Glyph that will be
    rendered as the graph edges.
    """)

    selection_policy = Instance(GraphHitTestPolicy, default=lambda: NodesOnly(), help="""
    An instance of a ``GraphHitTestPolicy`` that provides the logic for selection
    of graph components.
    """)

    inspection_policy = Instance(GraphHitTestPolicy, default=lambda: NodesOnly(), help="""
    An instance of a ``GraphHitTestPolicy`` that provides the logic for inspection
    of graph components.
    """)

@abstract
class GuideRenderer(Renderer):
    ''' A base class for all guide renderer types. ``GuideRenderer`` is
    not generally useful to instantiate on its own.

    '''

    level = Override(default="overlay")

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
