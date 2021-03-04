from os.path import dirname, join

from bokeh.core.properties import Color, Float, Int, Override, Seq
from bokeh.models import Renderer


class WaterfallRenderer(Renderer):

    __implementation__ = join(dirname(__file__), "waterfall.ts")

    latest = Seq(Float, default=[])

    palette = Seq(Color)

    num_grams = Int()

    gram_length = Int()

    tile_width = Int()

    level = Override(default="glyph")
