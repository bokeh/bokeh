.. _userguide_webgl:

Accelerating with WebGL
=======================

Bokeh provides limited support for rendering with WebGL. This can be useful
when visualizing larger data sets.

What is WebGL?
--------------

`WebGL`_ is a JavaScript API that allows rendering content in the browser
using hardware acceleration from a Graphics Processing Unit (GPU).
WebGL is standardized and available in all modern browsers.

How to enable WebGL
-------------------

To enable WebGL in Bokeh, set the plot's ``output_backend`` property to
``"webgl"``:

.. code-block:: python

    p = figure(output_backend="webgl")

Support
-------

Bokeh's WebGL support covers a subset of glyphs. This includes the :func:`~bokeh.plotting.Figure.line`
glyph, and most markers:

* :func:`~bokeh.plotting.Figure.asterisk`

* :func:`~bokeh.plotting.Figure.circle`

* :func:`~bokeh.plotting.Figure.circle_cross`

* :func:`~bokeh.plotting.Figure.circle_x`

* :func:`~bokeh.plotting.Figure.cross`

* :func:`~bokeh.plotting.Figure.diamond`

* :func:`~bokeh.plotting.Figure.diamond_cross`

* :func:`~bokeh.plotting.Figure.hex`

* :func:`~bokeh.plotting.Figure.inverted_triangle`

* :func:`~bokeh.plotting.Figure.square`

* :func:`~bokeh.plotting.Figure.square_cross`

* :func:`~bokeh.plotting.Figure.square_x`

* :func:`~bokeh.plotting.Figure.star`

* :func:`~bokeh.plotting.Figure.triangle`

* :func:`~bokeh.plotting.Figure.x`

You can combine multiple glyphs in a plot, even if some are rendered in WebGL,
and some are not.

Examples
--------

Here is an example of plotting ten thousand scatter circles with WebGL enabled.
Notice that the plot can be panned and zoomed smoothly, even without any
Level-of-Detail downsampling.

.. bokeh-plot:: ../../examples/webgl/scatter10k.py
    :source-position: above

Similarly, the plot below demonstrates plotting a single line with ten thousand
points.

.. bokeh-plot:: ../../examples/webgl/line10k.py
    :source-position: above

.. _WebGL: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
