from __future__ import absolute_import

from bokeh.plot_object import PlotObject
from bokeh.properties import Auto, Either, Enum, Float, Int, List, Tuple

class Foo(PlotObject):
    """ This is a Foo model. """
    index = Either(Auto, Enum('abc', 'def', 'xzy'), help="doc for index")
    value = Tuple(Float, Float, help="doc for value")

class Bar(PlotObject):
    """ This is a Bar model. """
    thing = List(Int, help="doc for thing")
