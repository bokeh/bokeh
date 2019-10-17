from bokeh.core.properties import Color, Float, Int, Override, Seq
from bokeh.models import Renderer

class WaterfallRenderer(Renderer):

    latest = Seq(Float)

    palette = Seq(Color)

    num_grams = Int()

    gram_length = Int()

    tile_width = Int()

    level = Override(default="glyph")
