.. _bokeh.models:

bokeh.models
============

.. automodule:: bokeh.models

These models are accumulatd into :class:`~bokeh.document.Document` instances,
which can be serialized and sent to clients (typically browsers) for display
or use there.

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

This reference links in the sidebar document all built-in Bokeh models,
together with their property attributes, as well as a JSON prototype
illustrating what a serialized version of the model looks like.

.. toctree::
   :maxdepth: 3
   :glob:

   models/*
