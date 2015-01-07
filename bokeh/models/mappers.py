from __future__ import absolute_import

from ..plot_object import PlotObject
from ..properties import Float, Color, Enum, Seq
from ..enums import Palette
from .. import palettes

class ColorMapper(PlotObject):
    """ Base class for color mapper objects. """

class LinearColorMapper(ColorMapper):
    palette = Seq(Color).accepts(Enum(Palette), lambda pal: getattr(palettes, pal))

    low = Float
    high = Float

    reserve_color = Color("#ffffff")    # TODO: What is the color code for transparent?
    reserve_val = Float(default=None)

    def __init__(self, palette=None, **kwargs):
        if palette is not None: kwargs['palette'] = palette
        super(LinearColorMapper, self).__init__(**kwargs)
