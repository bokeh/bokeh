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

Only a subset of Bokeh's glyphs have WebGL support. When you enable WebGL you
are requesting that it is used if available, and those glyphs that do not yet
support it will be rendered using the canvas backend as normal.

Support
-------

Bokeh's WebGL support covers the following fixed-shape glyphs:

* :func:`~bokeh.plotting.figure.block`

* :func:`~bokeh.plotting.figure.circle`

* :func:`~bokeh.plotting.figure.hbar`

* :func:`~bokeh.plotting.figure.hex_tile`

* :func:`~bokeh.plotting.figure.quad`

* :func:`~bokeh.plotting.figure.rect`

* :func:`~bokeh.plotting.figure.scatter`

* :func:`~bokeh.plotting.figure.vbar`

For these fixed-shape glyphs there is WebGL support for all fill properties,
all line properties except for dashed lines which are silently ignored, and
all hatch properties except for hatch images (the ``hatch_extra`` property)
which are silently ignored.

There is also full WebGL support for :func:`~bokeh.plotting.figure.line`
glyphs, although the appearance of dashed lines with round and square end caps
needs improvement.

When should you use WebGL?
--------------------------

A general rule of thumb is that if you are rendering fewer than 10 thousand
markers or lines with fewer than 10 thousand points then canvas is perfectly
adequate. Above 10 thousand markers or points WebGL will usually give
noticably better performance, and this will certainly be the case for 100
thousand markers or points.

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
