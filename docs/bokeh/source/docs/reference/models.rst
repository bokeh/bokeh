.. _bokeh.models:

bokeh.models
============

.. automodule:: bokeh.models

These models are accumulated into |Document| instances which can be serialized
and sent to clients (typically browsers) for display or use there.

As a concrete example, consider a column layout with ``Slider`` and ``Select``
widgets, and a plot with some tools, an axis and grid, and a glyph renderer
for circles. A simplified representation oh this document might look like the
figure below:

.. figure:: /_images/document.svg
    :align: center
    :width: 65%

    A Bokeh Document collects of Bokeh Models (e.g. plots, tools,
    glyphs, etc.) so that can be serialized as a single collection.

All of the rectangular boxes above are Bokeh models.

The :ref:`alphabetical class index <bokeh.models.classes>` and the topical
sections in the sidebar link to every built-in Bokeh model. Each class has a
dedicated page containing its properties and a JSON prototype illustrating
what a serialized version of the model looks like.

.. toctree::
    :maxdepth: 3
    :hidden:

    models/classes/index
    models/annotations
    models/axes
    models/callbacks
    models/canvas
    models/comparisons
    models/coordinates
    models/css
    models/expressions
    models/filters
    models/formatters
    models/glyphs
    models/graphs
    models/grids
    models/labeling
    models/layouts
    models/map_plots
    models/mappers
    models/misc
    models/nodes
    models/plots
    models/ranges
    models/renderers
    models/scales
    models/selections
    models/selectors
    models/sources
    models/text
    models/textures
    models/tickers
    models/tiles
    models/tools
    models/transforms
    models/ui
    models/widgets
