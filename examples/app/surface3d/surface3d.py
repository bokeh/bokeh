from bokeh.core.properties import Any, Dict, Instance, String
from bokeh.models import ColumnDataSource, LayoutDOM

# This defines some default options for the Graph3d feature of vis.js
# See: http://visjs.org/graph3d_examples.html for more details. Note
# that we are fixing the size of this component, in ``options``, but
# with additional work it could be made more responsive.
DEFAULTS = {
    'width':          '600px',
    'height':         '600px',
    'style':          'surface',
    'showPerspective': True,
    'showGrid':        True,
    'keepAspectRatio': True,
    'verticalRatio':   1.0,
    'legendLabel':     'stuff',
    'cameraPosition':  {
        'horizontal': -0.35,
        'vertical':    0.22,
        'distance':    1.8,
    }
}

# This custom extension model will have a DOM view that should layout-able in
# Bokeh layouts, so use ``LayoutDOM`` as the base class. If you wanted to create
# a custom tool, you could inherit from ``Tool``, or from ``Glyph`` if you
# wanted to create a custom glyph, etc.
class Surface3d(LayoutDOM):

    # The special class attribute ``__implementation__`` should contain a string
    # of JavaScript (or CoffeeScript) code that implements the JavaScript side
    # of the custom extension model.
    __implementation__ = "surface3d.coffee"

    # Below are all the "properties" for this model. Bokeh properties are
    # class attributes that define the fields (and their types) that can be
    # communicated automatically between Python and the browser. Properties
    # also support type validation. More information about properties in
    # can be found here:
    #
    #    http://bokeh.pydata.org/en/latest/docs/reference/core.html#bokeh-core-properties

    # This is a Bokeh ColumnDataSource that can be updated in the Bokeh
    # server by Python code
    data_source = Instance(ColumnDataSource)

    # The vis.js library that we are wrapping expects data for x, y, z, and
    # color. The data will actually be stored in the ColumnDataSource, but
    # these properties let us specify the *name* of the column that should
    # be used for each field.
    x = String

    y = String

    z = String

    color = String

    # Any of the available vis.js options for Graph3d can be set by changing
    # the contents of this dictionary.
    options = Dict(String, Any, default=DEFAULTS)
