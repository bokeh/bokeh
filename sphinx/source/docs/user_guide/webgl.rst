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

How to Enable WebGL
-------------------

To enable WebGL in Bokeh, set the plot's ``output_backend`` property to
``"webgl"``:

.. code-block:: python

    p = figure(output_backend="webgl")

Support
-------

Only a subset of Bokeh's objects are capable of rendering in WebGL. Currently
supported are the circle and line glyphs, and many markers: asterisk, circle,
square, diamond, triangle, inverted_triangle, cross, circle_cross, square_cross,
diamond_cross, x, square_x, and circle_x. You can safely combine multiple glyphs
in a plot, even if some are rendered in WebGL, and some are not.

Examples
--------

Here is an example of plotting ten thousand scatter circles with WebGL enabled.
Notice that that plot can be panned and zoomed smoothly, even without any
Level-of-Detail downsampling.

.. bokeh-plot:: ../../examples/webgl/scatter10k.py
    :source-position: above

Simlilary, the plot below demonstrates plotting a single line with ten thousand
points.

.. bokeh-plot:: ../../examples/webgl/line10k.py
    :source-position: above

.. _WebGL: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
