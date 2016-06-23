from os.path import dirname, join

from bokeh.models import LayoutDOM

class Waterfall(GlyphRenderer):

    __implementation__ = open(join(dirname(__file__)), "waterfall.coffee")


