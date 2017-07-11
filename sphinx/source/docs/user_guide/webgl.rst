.. _userguide_webgl:

Speeding up with WebGL
======================

When visualizing large datasets with Bokeh, the interaction can become
rather slow. To counter this, one can enable WebGL, which allows
rendering some glyph types on graphics hardware.

What is WebGL?
--------------

WebGL is a JavaScript API that allows rendering content in the browser
via the Graphics Processing Unit (GPU), without the need for plugins.
WebGL is standardized and available in all modern browsers.

How to enable WebGL
-------------------

To enable WebGL, set the plot's ``output_backend`` property to ``"webgl"``:

.. code-block:: python

    p = Plot(output_backend="webgl")  # for the glyph API
    p = figure(output_backend="webgl")  # for the plotting API

Support
-------

Only a subset of Bokeh's objects are capable of rendering in WebGL.
Currently supported are the circle and line glyphs, and all markers
supported by ``scatter()`` (asterisk, circle, square, diamond, triangle,
inverted_triangle, cross, circle_cross, square_cross, diamond_cross,
x, square_x, circle_x). You can safely combine multiple glyphs in a
plot, even if some are rendered in WebGL, and some are not.

The performance improvements when using WebGL varies per situation. Due
to overhead in some places of BokehJS, we can currently not benefit
from the full speed that you might expect from WebGL. This is also
something we plan to improve over time.

Notes
-----

* Glyphs drawn using WebGL are drawn on top of glyphs that are not drawn
  in WebGL.
* When the scale is non-linear (e.g. log), the system falls back to 2D
  rendering.
* Making a selections of markers on Internet Explorer will reduce the size
  of the markers to 1 pixel (looks like a bug in IE).

Examples
--------


.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.plotting import figure, show, output_file

    N = 10000

    x = np.random.normal(0, np.pi, N)
    y = np.sin(x) + np.random.normal(0, 0.2, N)

    output_file("scatter10k.html", title="scatter 10k points (no WebGL)")

    p = figure(output_backend="canvas")
    p.scatter(x, y, alpha=0.1)
    show(p)


.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.plotting import figure, show, output_file

    N = 10000

    x = np.random.normal(0, np.pi, N)
    y = np.sin(x) + np.random.normal(0, 0.2, N)

    output_file("scatter10k.html", title="scatter 10k points (with WebGL)")

    p = figure(output_backend="webgl")
    p.scatter(x, y, alpha=0.1)
    show(p)


.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.plotting import figure, show, output_file

    N = 10000

    x = np.linspace(0, 10*np.pi, N)
    y = np.cos(x) + np.sin(2*x+1.25) + np.random.normal(0, 0.001, (N, ))

    output_file("line10k.html", title="line10k.py example")

    p = figure(title="A line consisting of 10k points", output_backend="webgl")
    p.line(x, y, color="#22aa22", line_width=3)
    show(p)
