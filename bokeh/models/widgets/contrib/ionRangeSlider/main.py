#from bokeh.core.properties import (Float, Instance, Tuple, Bool, Enum,
#                                   List, String, Any)
import os

from IPython import embed

from bokeh.core.properties import Bool, Float, String, Enum, Tuple, Instance, Color, List, Any
from bokeh.core.enums import SliderCallbackPolicy, enumeration
from bokeh.models.widgets import Div
from bokeh.models.callbacks import Callback
from bokeh.util.compiler import TypeScript
from bokeh.models import Widget
from bokeh.models.widgets import AbstractSlider

class IonRangeSlider(AbstractSlider):
    # The special class attribute ``__implementation__`` should contain a string
    # of JavaScript (or CoffeeScript) code that implements the JavaScript side
    # of the custom extension model or a string name of a JavaScript (or
    # CoffeeScript) file with the implementation.

    #with open(os.path.join(os.path.dirname(__file__), '../bokeh-ion-rangesliderjs/src/ion_range_slider.ts')) as file_:
    #    implementation = file_.readlines()
    #__implementation__ = TypeScript(''.join(implementation))
    __javascript__ = ["https://ajax.googleapis.com/ajax/libs/jquery/3.1.0/jquery.min.js",
                      "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/js/ion.rangeSlider.js"]
    __css__ = ["https://cdnjs.cloudflare.com/ajax/libs/normalize/4.2.0/normalize.css",
               "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/css/ion.rangeSlider.css",
               "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/css/ion.rangeSlider.skinFlat.min.css",
               "https://cdnjs.cloudflare.com/ajax/libs/ion-rangeslider/2.1.4/img/sprite-skin-flat.png"]

    # Below are all the "properties" for this model. Bokeh properties are
    # class attributes that define the fields (and their types) that can be
    # communicated automatically between Python and the browser. Properties
    # also support type validation. More information about properties in
    # can be found here:
    #
    #    http://bokeh.pydata.org/en/latest/docs/reference/core.html#bokeh-core-properties

    start = Float(default=0, help="""
    The minimum allowable value.
    """)

    end = Float(default=1, help="""
    The maximum allowable value.
    """)

    value = Tuple(Float, Float, default = [0, 1], help="""
    Initial or selected range.
    """)

    step = Float(default=0.1, help="""
    The step between consecutive values.
    """)

    #format = String(default="0[.]00") Ignored right now

    #bar_color = Color(default="#e6e6e6", help=""" """) Overwritten default

    slider_type = Enum(enumeration('single', 'double'), default='single', help="""
    Choose slider type, could be single - for one handle, or double for
    two handles.
    """)

    values = List(Any, help="""
    Set up your own array of possible slider values. They could be numbers
    or strings. The following attributes are ignored if you supply values:
    min, max and step.
    """)

    grid = Bool(default=True, help="""
    Show the grid beneath the slider.
    """)

    prettify_enabled = Bool(default=True, help="""
    Improve readability of long numbers. 10000000 -> 10 000 000
    """)

    prettify = Instance(Callback, help="""
    Set up your own prettify function. Can be anything. For example, you can
    set up unix time as slider values and than transform them to cool looking
    dates.
    """)

    force_edges = Bool(default=False, help="""
    Slider will be always inside it's container.
    """)

    prefix = String(default="", help="""
    Set prefix for values. Will be set up right before the number: $100
    """)
