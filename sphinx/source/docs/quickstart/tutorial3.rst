.. _quickstart_tutorial3:

Tutorial 3: Vectorizing colors and sizes
########################################

TBD TBD TBD TBD

Vectorized Colors and Sizes
---------------------------

This example shows how it is possible to provide sequences of data values for
glyph attributes like ``fill_color`` and ``radius``. Other things to look out
for in this example:

* supplying an explicit list of tool names to |figure|
* fetching BokehJS resources from CDN using the ``mode`` argument
* setting the ``x_range`` and ``y_range`` explicitly
* turning a line *off* (by setting its value to ``None``)
* using NumPy arrays for supplying data

.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    N = 4000
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = [
        "#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)
    ]

    # output to static HTML file (with CDN resources)
    output_file("color_scatter.html", title="color_scatter.py example", mode="cdn")

    TOOLS = "crosshair,pan,wheel_zoom,box_zoom,reset,box_select,lasso_select"

    # create a new plot with the tools above, and explicit ranges
    p = figure(tools=TOOLS, x_range=(0, 100), y_range=(0, 100))

    # add a circle renderer with vectorized colors and sizes
    p.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

    # show the results
    show(p)
