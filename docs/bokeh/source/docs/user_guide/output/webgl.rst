.. _ug_output_webgl:

WebGL acceleration
==================

Bokeh provides limited support for WebGL to render plots in a web browser. Using
WebGL in Bokeh can be useful when visualizing larger data sets, for example.

`WebGL`_ is a JavaScript API that allows rendering content in the browser
using hardware acceleration from a Graphics Processing Unit (GPU).
WebGL is standardized and available in all modern browsers.

If you use Bokeh's WebGL output backend, Bokeh will automatically detect if the
browser supports WebGL. When you use WebGL-enabled elements in your Bokeh plot
but the browser doesn't support WebGL, Bokeh will automatically use the default
canvas renderer instead.

Enabling WebGL
--------------

To enable WebGL in Bokeh, set the plot's ``output_backend`` property to
``"webgl"``:

.. code-block:: python

    p = figure(output_backend="webgl")

The WebGL output backend only supports a :ref:`subset of Bokeh's glyphs
<ug_output_webgl_supported_glyphs>`. When you enable WebGL, you are requesting
that WebGL rendering is used if available. Glyphs that are not available in the
WebGL output backend are rendered with the default canvas backend.

If you enable Bokeh's WebGL output backend, WebGL will be used whenever
supported by a browser. This includes output in :ref:`Jupyter notebooks or
Jupyter lab <ug_output_jupyter>` and when :ref:`exporting Bokeh plots to PNG
<ug_output_export>` if the underlying browser (including headless browsers)
supports WebGL.

.. _ug_output_webgl_supported_glyphs:

Supported glyphs
----------------

Scatter and other fixed-shape glyphs
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Bokeh's WebGL support covers the following fixed-shape glyphs:

* :func:`~bokeh.plotting.figure.annular_wedge`

* :func:`~bokeh.plotting.figure.annulus`

* :func:`~bokeh.plotting.figure.block`

* :func:`~bokeh.plotting.figure.circle`

* :func:`~bokeh.plotting.figure.hbar`

* :func:`~bokeh.plotting.figure.hex_tile`

* :func:`~bokeh.plotting.figure.quad`

* :func:`~bokeh.plotting.figure.rect`

* :func:`~bokeh.plotting.figure.scatter`

* :func:`~bokeh.plotting.figure.vbar`

* :func:`~bokeh.plotting.figure.wedge`

WebGL support for these fixed-shape glyphs covers the following properties:

* all :ref:`fill properties <ug_styling_fill_properties>`
* all :ref:`line properties <ug_styling_line_properties>` except for
  dashed lines (which will be ignored)
* all :ref:`hatch properties <ug_styling_hatch_properties>` except for
  hatch images using the ``hatch_extra`` property (which will be ignored).

Line glyphs
^^^^^^^^^^^

There is full WebGL support for :func:`~bokeh.plotting.figure.line`,
:func:`~bokeh.plotting.figure.multi_line` and :func:`~bokeh.plotting.figure.step`
glyphs, although the appearance of dashed lines with round and square end caps
may differ slightly from the default HTML canvas rendering.

Image glyphs
^^^^^^^^^^^^

Bokeh also supports WebGL :func:`~bokeh.plotting.figure.image`,
:func:`~bokeh.plotting.figure.image_rgba` and :func:`~bokeh.plotting.figure.image_stack`
glyphs, but not :func:`~bokeh.plotting.figure.image_url`.


When to use WebGL
-----------------

A general rule of thumb is that Bokeh's default canvas output backend works well
if you are rendering fewer than 10,000 markers or points. For plots with more
than 25,000 markers or points, WebGL will usually give noticeably better
performance. Generally, the more markers or points to render, the more efficient
WebGL will be compared to the default canvas output backend. The number of
markers or points at which WebGL performance exceeds canvas depends on the
hardware available, so you will need to try it out on your own hardware to see
what is best for you.


WebGL examples
--------------

The following example is a plot with 10,000 scatter circles with WebGL enabled.
Notice that the plot can be panned and zoomed smoothly, even without
downsampling the data.

.. bokeh-plot:: __REPO__/examples/output/webgl/scatter10k.py
    :source-position: above

Similarly, the plot below demonstrates plotting a single line with 10,000
points.

.. bokeh-plot:: __REPO__/examples/output/webgl/line10k.py
    :source-position: above

.. _WebGL: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
