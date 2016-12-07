from __future__ import absolute_import

from bokeh.model import Model
from bokeh.core.enums import enumeration
from bokeh.core.properties import Auto, Either, Enum, Float, Int, List, Tuple

class Foo(Model):
    """ This is a Foo model. """
    index = Either(Auto, Enum('abc', 'def', 'xzy'), help="doc for index")
    value = Tuple(Float, Float, help="doc for value")

class Bar(Model):
    """ This is a Bar model. """
    thing = List(Int, help="doc for thing")

#: This is an enumeration
baz = enumeration("a", "b", "c")
