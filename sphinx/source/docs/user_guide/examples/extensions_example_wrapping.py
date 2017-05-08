from __future__ import division

import numpy as np

from bokeh.core.properties import Instance, String
from bokeh.models import ColumnDataSource, LayoutDOM
from bokeh.io import show

JS_CODE = """
# This file contains the JavaScript (CoffeeScript) implementation
# for a Bokeh custom extension. The "surface3d.py" contains the
# python counterpart.
#
# This custom model wraps one part of the third-party vis.js library:
#
#     http://visjs.org/index.html
#
# Making it easy to hook up python data analytics tools (NumPy, SciPy,
# Pandas, etc.) to web presentations using the Bokeh server.

# These "require" lines are similar to python "import" statements
import * as p from "core/properties"
import {LayoutDOM, LayoutDOMView} from "models/layouts/layout_dom"

# This defines some default options for the Graph3d feature of vis.js
# See: http://visjs.org/graph3d_examples.html for more details.
OPTIONS =
  width:  '600px'
  height: '600px'
  style: 'surface'
  showPerspective: true
  showGrid: true
  keepAspectRatio: true
  verticalRatio: 1.0
  legendLabel: 'stuff'
  cameraPosition:
    horizontal: -0.35
    vertical: 0.22
    distance: 1.8

# To create custom model extensions that will render on to the HTML canvas
# or into the DOM, we must create a View subclass for the model. Currently
# Bokeh models and views are based on BackBone. More information about
# using Backbone can be found here:
#
#     http://backbonejs.org/
#
# In this case we will subclass from the existing BokehJS ``LayoutDOMView``,
# corresponding to our
export class Surface3dView extends LayoutDOMView

  initialize: (options) ->
    super(options)

    url = "https://cdnjs.cloudflare.com/ajax/libs/vis/4.16.1/vis.min.js"

    script = document.createElement('script')
    script.src = url
    script.async = false
    script.onreadystatechange = script.onload = () => @_init()
    document.querySelector("head").appendChild(script)

  _init: () ->
    # Create a new Graph3s using the vis.js API. This assumes the vis.js has
    # already been loaded (e.g. in a custom app template). In the future Bokeh
    # models will be able to specify and load external scripts automatically.
    #
    # Backbone Views create <div> elements by default, accessible as @el. Many
    # Bokeh views ignore this default <div>, and instead do things like draw
    # to the HTML canvas. In this case though, we use the <div> to attach a
    # Graph3d to the DOM.
    @_graph = new vis.Graph3d(@el, @get_data(), OPTIONS)

    # Set Backbone listener so that when the Bokeh data source has a change
    # event, we can process the new data
    @connect(@model.data_source.change, () =>
        @_graph.setData(@get_data())
    )

  # This is the callback executed when the Bokeh data has an change. Its basic
  # function is to adapt the Bokeh data source to the vis.js DataSet format.
  get_data: () ->
    data = new vis.DataSet()
    source = @model.data_source
    for i in [0...source.get_length()]
      data.add({
        x:     source.get_column(@model.x)[i]
        y:     source.get_column(@model.y)[i]
        z:     source.get_column(@model.z)[i]
        style: source.get_column(@model.color)[i]
      })
    return data

# We must also create a corresponding JavaScript Backbone model sublcass to
# correspond to the python Bokeh model subclass. In this case, since we want
# an element that can position itself in the DOM according to a Bokeh layout,
# we subclass from ``LayoutDOM``
export class Surface3d extends LayoutDOM

  # This is usually boilerplate. In some cases there may not be a view.
  default_view: Surface3dView

  # The ``type`` class attribute should generally match exactly the name
  # of the corresponding Python class.
  type: "Surface3d"

  # The @define block adds corresponding "properties" to the JS model. These
  # should basically line up 1-1 with the Python model class. Most property
  # types have counterparts, e.g. ``bokeh.core.properties.String`` will be
  # ``p.String`` in the JS implementatin. Where the JS type system is not yet
  # as rich, you can use ``p.Any`` as a "wildcard" property type.
  @define {
    x:           [ p.String           ]
    y:           [ p.String           ]
    z:           [ p.String           ]
    color:       [ p.String           ]
    data_source: [ p.Instance         ]
  }
"""

# This custom extension model will have a DOM view that should layout-able in
# Bokeh layouts, so use ``LayoutDOM`` as the base class. If you wanted to create
# a custom tool, you could inherit from ``Tool``, or from ``Glyph`` if you
# wanted to create a custom glyph, etc.
class Surface3d(LayoutDOM):

    # The special class attribute ``__implementation__`` should contain a string
    # of JavaScript (or CoffeeScript) code that implements the JavaScript side
    # of the custom extension model.
    __implementation__ = JS_CODE

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

x = np.arange(0, 300, 10)
y = np.arange(0, 300, 10)
xx, yy = np.meshgrid(x, y)
xx = xx.ravel()
yy = yy.ravel()
value = np.sin(xx/50) * np.cos(yy/50) * 50 + 50

source = ColumnDataSource(data=dict(x=xx, y=yy, z=value, color=value))

surface = Surface3d(x="x", y="y", z="z", color="color", data_source=source)

show(surface)
