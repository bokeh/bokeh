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

Only a subset of Bokeh's objects are capable of rendering in WebGL. Currently
supported are the circle and :class:`~bokeh.models.glyphs.Line` glyphs, and many markers:

* :class:`~bokeh.models.markers.Asterisk`

* :class:`~bokeh.models.markers.Circle`

* :class:`~bokeh.models.markers.CircleCross`

* :class:`~bokeh.models.markers.CircleX`

* :class:`~bokeh.models.markers.Cross`

* :class:`~bokeh.models.markers.Diamond`

* :class:`~bokeh.models.markers.DiamondCross`

* :class:`~bokeh.models.markers.Hex`

* :class:`~bokeh.models.markers.InvertedTriangle`

* :class:`~bokeh.models.markers.Square`

* :class:`~bokeh.models.markers.SquareCross`

* :class:`~bokeh.models.markers.SquareX`

* :class:`~bokeh.models.markers.Triangle`

* :class:`~bokeh.models.markers.X`

You can safely combine multiple glyphs in a plot, even if some are rendered in WebGL,
and some are not.

Examples
--------

Here is an example of plotting ten thousand scatter circles with WebGL enabled.
Notice that that plot can be panned and zoomed smoothly, even without any
Level-of-Detail downsampling.

.. bokeh-plot:: ../../examples/webgl/scatter10k.py
    :source-position: above

Similarly, the plot below demonstrates plotting a single line with ten thousand
points.

.. bokeh-plot:: ../../examples/webgl/line10k.py
    :source-position: above

.. _WebGL: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
