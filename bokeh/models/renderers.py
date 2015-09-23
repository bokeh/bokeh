""" Models (mostly base classes) for the various kinds of renderer
types that Bokeh supports.

"""
from __future__ import absolute_import

import logging

from ..plot_object import PlotObject
from ..properties import abstract
from ..properties import String, Enum, Instance
from ..enums import Units, RenderLevel
from ..validation.errors import BAD_COLUMN_NAME, MISSING_GLYPH, NO_SOURCE_FOR_GLYPH
from .. import validation

from .sources import DataSource, RemoteSource
from .glyphs import Glyph

logger = logging.getLogger(__name__)


@abstract
class Renderer(PlotObject):
    """ A base class for renderer types. ``Renderer`` is not
    generally useful to instantiate on its own.

    """

class GlyphRenderer(Renderer):
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
        for name, item in self.glyph.vm_serialize().items():
            if not isinstance(item, dict): continue
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

    # TODO: (bev) is this actually used?
    units = Enum(Units)

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

    level = Enum(RenderLevel, default="glyph", help="""
    Specifies the level in which to render the glyph.
    """)

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
