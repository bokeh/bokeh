""" Models (mostly base classes) for the various kinds of renderer
types that Bokeh supports.

"""
from __future__ import absolute_import

import logging
logger = logging.getLogger(__name__)

from ..model import Model
from ..core.enums import RenderLevel
from ..core.properties import abstract
from ..core.properties import String, Enum, Instance, Float, Bool, Override
from ..core import validation
from ..core.validation.errors import BAD_COLUMN_NAME, MISSING_GLYPH, NO_SOURCE_FOR_GLYPH

from .glyphs import Glyph
from .images import ImageSource
from .sources import DataSource, RemoteSource, ColumnDataSource
from .tiles import TileSource, WMTSTileSource

@abstract
class Renderer(Model):
    """An abstract base class for renderer types.
    """

    level = Enum(RenderLevel, help="""
    Specifies the level in which to paint this renderer.
    """)

    visible = Bool(default=True, help="""
    Is the renderer visible. Default: True
    """)

@abstract
class DataRenderer(Renderer):
    """ An abstract base class for data renderer types (e.g. ``GlyphRenderer``, ``TileRenderer``).
    """

class TileRenderer(DataRenderer):

    tile_source = Instance(TileSource, default=lambda: WMTSTileSource(), help="""
    Local data source to use when rendering glyphs on the plot.
    """)

    alpha = Float(1.0, help="""
    tile opacity 0.0 - 1.0
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen
    locations when rendering glyphs on the plot. If unset, use the
    default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen
    locations when rendering glyphs on the plot. If unset, use the
    default y-range.
    """)

    level = Override(default="underlay")

    render_parents = Bool(default=True, help="""
    Flag enable/disable drawing of parent tiles while waiting for new tiles to arrive. Default value is True.
    """)

class DynamicImageRenderer(DataRenderer):

    image_source = Instance(ImageSource, help="""
    Image source to use when rendering on the plot.
    """)

    alpha = Float(1.0, help="""
    tile opacity 0.0 - 1.0
    """)

    level = Override(default="underlay")

    render_parents = Bool(default=True, help="""
    Flag enable/disable drawing of parent tiles while waiting for new tiles to arrive. Default value is True.
    """)

class GlyphRenderer(DataRenderer):
    """

    """

    @validation.error(MISSING_GLYPH)
    def _check_missing_glyph(self):
        if not self.glyph: return str(self)

    @validation.error(NO_SOURCE_FOR_GLYPH)
    def _check_no_source_for_glyph(self):
        if not self.data_source: return str(self)

    @validation.error(BAD_COLUMN_NAME)
    def _check_bad_column_name(self):
        if not self.glyph: return
        if not self.data_source: return
        if isinstance(self.data_source, RemoteSource): return
        missing = set()
        specs = self.glyph.dataspecs()
        for name, item in self.glyph.properties_with_values(include_defaults=False).items():
            if name not in specs: continue
            if not isinstance(item, dict): continue
            if not isinstance(self.data_source, ColumnDataSource): continue
            if 'field' in item and item['field'] not in self.data_source.column_names:
                missing.add(item['field'])
        if missing:
            return "%s [renderer: %s]" % (", ".join(sorted(missing)), self)

    data_source = Instance(DataSource, help="""
    Local data source to use when rendering glyphs on the plot.
    """)

    x_range_name = String('default', help="""
    A particular (named) x-range to use for computing screen
    locations when rendering glyphs on the plot. If unset, use the
    default x-range.
    """)

    y_range_name = String('default', help="""
    A particular (named) y-range to use for computing screen
    locations when rendering glyphs on the plot. If unset, use the
    default -range.
    """)

    glyph = Instance(Glyph, help="""
    The glyph to render, in conjunction with the supplied data source
    and ranges.
    """)

    selection_glyph = Instance(Glyph, help="""
    An optional glyph used for selected points.
    """)

    nonselection_glyph = Instance(Glyph, help="""
    An optional glyph used for explicitly non-selected points
    (i.e., non-selected when there are other points that are selected,
    but not when no points at all are selected.)
    """)

    hover_glyph = Instance(Glyph, help="""
    An optional glyph used for inspected points, e.g., those that are
    being hovered over by a HoverTool.
    """)

    level = Override(default="glyph")

@abstract
class GuideRenderer(Renderer):
    """ A base class for all guide renderer types. ``GuideRenderer`` is
    not generally useful to instantiate on its own.

    """

    plot = Instance(".models.plots.Plot", help="""
    The plot to which this guide renderer is attached.
    """)

    def __init__(self, **kwargs):
        super(GuideRenderer, self).__init__(**kwargs)

        if self.plot is not None:
            if self not in self.plot.renderers:
                self.plot.renderers.append(self)

    level = Override(default="overlay")
