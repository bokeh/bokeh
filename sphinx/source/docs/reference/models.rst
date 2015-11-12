
.. _bokeh.models:

``bokeh.models`` Interface
==========================

One of the central design principals of Bokeh is that, regardless of
how the plot creation code is spelled in Python (or other languages),
the result is an object graph that encompasses all the visual and
data aspects of the scene. Furthermore, this scene graph is to be
serialized, and it is this serialized graph that the client library
BokehJS uses to render the plot. The low-level objects that comprise
a Bokeh scene graph are called **Models**.

This reference documents all the Bokeh models, together with their
property attributes, as well as a JSON prototype illustrating what
a serialized version of the model looks like.

.. toctree::
   :maxdepth: 2

   models/annotations
   models/axes
   models/callbacks
   models/formatters
   models/glyphs
   models/grids
   models/map_plots
   models/mappers
   models/markers
   models/plots
   models/ranges
   models/renderers
   models/sources
   models/tickers
   models/tiles
   models/tools
   models/widgets.widget
   models/widgets.buttons
   models/widgets.dialogs
   models/widgets.groups
   models/widgets.icons
   models/widgets.inputs
   models/widgets.layouts
   models/widgets.markups
   models/widgets.panels
   models/widgets.tables
