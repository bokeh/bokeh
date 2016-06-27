from os.path import dirname, join

from bokeh.core.properties import List, Float, Seq, Color, Int
from bokeh.models import ColumnDataSource

class WaterfallSource(ColumnDataSource):

    __implementation__ = open(join(dirname(__file__), "waterfall.coffee")).read()

    latest = List(Float)

    palette = Seq(Color)

    num_grams = Int()

    gram_length = Int()

    tile_width = Int()
