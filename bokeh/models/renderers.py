from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Int, String, Enum, Instance, List, Dict, Include
from ..mixins import LineProps, TextProps
from ..enums import Units, Orientation

from .sources import DataSource, ServerDataSource
from .glyphs import Glyph

class Renderer(PlotObject):
    pass

class GlyphRenderer(Renderer):
    server_data_source = Instance(ServerDataSource)
    data_source = Instance(DataSource)
    x_range_name = String('default')
    y_range_name = String('default')

    # How to intepret the values in the data_source
    units = Enum(Units)

    glyph = Instance(Glyph)

    # Optional glyph used when data is selected.
    selection_glyph = Instance(Glyph)
    # Optional glyph used when data is unselected.
    nonselection_glyph = Instance(Glyph)

class Legend(Renderer):
    plot = Instance(".models.plots.Plot")
    orientation = Enum(Orientation)
    border_props = Include(LineProps)

    label_props = Include(TextProps)
    label_standoff = Int(15)
    label_height = Int(20)
    label_width = Int(50)

    glyph_height = Int(20)
    glyph_width = Int(20)

    legend_padding = Int(10)
    legend_spacing = Int(3)
    legends = Dict(String, List(Instance(GlyphRenderer)))

class GuideRenderer(Renderer):
    plot = Instance(".models.plots.Plot")

    def __init__(self, **kwargs):
        super(GuideRenderer, self).__init__(**kwargs)

        if self.plot is not None:
            if self not in self.plot.renderers:
                self.plot.renderers.append(self)
