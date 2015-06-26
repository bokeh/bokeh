.. _userguide_plotting:

Plotting with Basic Glyphs
==========================

.. contents::
    :local:
    :depth: 3

.. _userguide_plotting_figures:

Creating Figures
----------------

Note that Bokeh plots created using the |bokeh.plotting| interface come with
a default set of tools, and default visual styles. See :ref:`userguide_styling`
for information about how to customize the visual style of plots, and
:ref:`userguide_tools` for information about changing or specifying tools.

.. _userguide_plotting_scatter_markers:

Scatter Markers
~~~~~~~~~~~~~~~

To scatter circle markers on a plot, use the |circle| method of |Figure|:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # output to static HTML file
    output_file("line.html")

    p = figure(plot_width=400, plot_height=400)

    # add a circle renderer with a size, color, and alpha
    p.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)

    # show the results
    show(p)

Similarly, to scatter square markers, use the |square| method of |Figure|:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # output to static HTML file
    output_file("square.html")

    p = figure(plot_width=400, plot_height=400)

    # add a square renderer with a size, color, and alpha
    p.square([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="olive", alpha=0.5)

    # show the results
    show(p)

There are lots of marker types available in Bokeh, you can see details and
example plots for all of them by clicking on entries in the list below:

.. hlist::
    :columns: 3

    * |asterisk|
    * |circle|
    * |circle_cross|
    * |circle_x|
    * |cross|
    * |diamond|
    * |diamond_cross|
    * |inverted_triangle|
    * |square|
    * |square_cross|
    * |square_x|
    * |triangle|
    * |x|

All the markers have the same set of properties: ``x``, ``y``, ``size`` (in
screen units), and ``angle`` (radians by default). Additionally, |circle| has
a ``radius`` property that can be used to specify data-space units.

.. _userguide_plotting_line_glyphs:

Line Glyphs
~~~~~~~~~~~

Single Lines
''''''''''''

Below is an example that shows how to generate a single line glyph from
one dimensional sequences of *x* and *y* points using the |line| glyph
method:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("line.html")

    p = figure(plot_width=400, plot_height=400)

    # add a line renderer
    p.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=2)

    show(p)

Multiple Lines
''''''''''''''

Sometimes it is useful to plot multiple lines all at once. This can be
accomplished with the |multi_line| glyph method:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("patch.html")

    p = figure(plot_width=400, plot_height=400)

    p.multi_line([[1, 3, 2], [3, 4, 6, 6]], [[2, 1, 4], [4, 7, 8, 5]],
                 color=["firebrick", "navy"], alpha=[0.8, 0.3], line_width=4)

    show(p)

.. note::
    This glyph is unlike most other glyphs. Instead of accepting a one
    dimensional list or array of scalar values, it accepts a "list of lists".

Missing Points
''''''''''''''

``NaN`` values can be passed to |line| and |multi_line| glyphs. In this case,
you end up with single logical line objects, that have multiple disjoint
components when rendered:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("line.html")

    p = figure(plot_width=400, plot_height=400)

    # add a line renderer with a NaN
    nan = float('nan')
    p.line([1, 2, 3, nan, 4, 5], [6, 7, 2, 4, 4, 5], line_width=2)

    show(p)

.. _userguide_plotting_patch_glyphs:

Patch Glyphs
~~~~~~~~~~~~

Single Patches
''''''''''''''

Below is an example that shows how to generate a single polygonal patch
glyph from one dimensional sequences of *x* and *y* points using the
|patch| glyph method:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("patch.html")

    p = figure(plot_width=400, plot_height=400)

    # add a patch renderer with an alpha an line width
    p.patch([1, 2, 3, 4, 5], [6, 7, 8, 7, 3], alpha=0.5, line_width=2)

    show(p)

Multiple Patches
''''''''''''''''

Sometimes it is useful to plot multiple lines all at once. This can be
accomplished with the |patches| glyph method:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("patch.html")

    p = figure(plot_width=400, plot_height=400)

    p.patches([[1, 3, 2], [3, 4, 6, 6]], [[2, 1, 4], [4, 7, 8, 5]],
              color=["firebrick", "navy"], alpha=[0.8, 0.3], line_width=2)

    show(p)

.. note::
    This glyph is unlike most other glyphs. Instead of accepting a one
    dimensional list or array of scalar values, it accepts a "list of lists".

Missing Points
''''''''''''''

Just as with |line| and |multi_line|, ``NaN`` values can be passed to
|patch| and |patches| glyphs. In this case, you end up with single logical
patch objects, that have multiple disjoint components when rendered:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("patch.html")

    p = figure(plot_width=400, plot_height=400)

    # add a patch renderer with a NaN value
    nan = float('nan')
    p.patch([1, 2, 3, nan, 4, 5, 6], [6, 7, 5, nan, 7, 3, 6], alpha=0.5, line_width=2)

    show(p)

.. warning::
    Hit testing on patch objects with ``NaN`` values is not currently
    supported.

.. _userguide_plotting_quads_rects:

Rectangles and Ovals
~~~~~~~~~~~~~~~~~~~~

To draw *axis aligned* rectangles ("quads"), use the |quad| glyph function,
which accepts ``left``, ``right``, ``top``, and ``bottom`` values to specify
positions:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.quad(top=[2, 3, 4], bottom=[1, 2, 3], left=[1, 2, 3],
        right=[1.2, 2.5, 3.7], color="#B3DE69")

    show(p)

To draw arbitrary rectangles by specifying a center point, a width, height,
and angle, use the |rect| glyph function:

.. bokeh-plot::
    :source-position: above

    from math import pi
    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.rect(x=[1, 2, 3], y=[1, 2, 3], width=0.2, height=40, color="#CAB2D6",
        angle = pi/3, height_units="screen")

    show(p)

The |oval| glyph method accepts the same properties as |rect|, but renders
oval shapes:

.. bokeh-plot::
    :source-position: above

    from math import pi
    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.oval(x=[1, 2, 3], y=[1, 2, 3], width=0.2, height=40, color="#CAB2D6",
        angle = pi/3, height_units="screen")

    show(p)

.. _userguide_plotting_images:

Images
~~~~~~

You can dipslay images on Bokeh plots using the |image|, |image_rgba|, and
|image_url| glyph methods.

The first example here shows how to display images in Bokeh plots from
raw RGBA data using |image_rgba|:

.. note::
    This example depends on the open source NumPy library in order to more
    easily generate an array of RGBA data.

.. bokeh-plot::
    :source-position: above

    from __future__ import division

    import numpy as np

    from bokeh.plotting import figure, output_file, show

    # create an array of RGBA data
    N = 20
    img = np.empty((N,N), dtype=np.uint32)
    view = img.view(dtype=np.uint8).reshape((N, N, 4))
    for i in range(N):
        for j in range(N):
            view[i, j, 0] = int(255 *i/N)
            view[i, j, 1] = 158
            view[i, j, 2] = int(255* j/N)
            view[i, j, 3] = 255

    output_file("image_rgba.html")

    p = figure(plot_width=400, plot_height=400, x_range=(0,10), y_range=(0,10))

    p.image_rgba(image=[img], x=[0], y=[0], dw=[10], dh=[10])

    show(p)

.. _userguide_plotting_segments_rays:

Segments and Rays
~~~~~~~~~~~~~~~~~

Sometimes it is useful to be able to draw many individual line segments at
once. Bokeh provides the |segment| and |ray| glyph methods to render these.

The |segment| function accepts start points ``x0``, ``y0`` and end points
``x1`` and ``y1`` and renders segments between these:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.segment(x0=[1, 2, 3], y0=[1, 2, 3], x1=[1.2, 2.4, 3.1],
                y1=[1.2, 2.5, 3.7], color="#F4A582", line_width=3)

    show(p)

The |ray| function accepts start points ``x``, ``y`` with a ``length``
(in screen units) and an ``angle``. The default ``angle_units`` are ``"rad"``
but can also be changed to ``"deg"``. To have an "infinite" ray, that always
extends to the edge of the plot, specify ``0`` for the length:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.ray(x=[1, 2, 3], y=[1, 2, 3], length=45, angle=[30, 45, 60],
          angle_units="deg", color="#FB8072", line_width=2)

    show(p)

.. _userguide_plotting_wedges_arcs:

Wedges and Arcs
~~~~~~~~~~~~~~~

To draw a simple line arc, Bokeh provides the |arc| glyph method, which
accepts ``radius``, ``start_angle``, and ``end_angle`` to determine position.
Additionally, the ``direction`` property determines whether to render
clockwise (``"clocl"``) or anti-clockwise (``"anticlock"``) between the start
and end angles.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.arc(x=[1, 2, 3], y=[1, 2, 3], radius=0.1, start_angle=0.4, end_angle=4.8, color="navy")

    show(p)

The |wedge| glyph method accepts the same properties as |arc|, but renders a
filled wedge instead:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.wedge(x=[1, 2, 3], y=[1, 2, 3], radius=0.2, start_angle=0.4, end_angle=4.8,
            color="firebrick", alpha=0.6, direction="clock")

    show(p)

The |annular_wedge| glyph method is similar to |arc|, but draws a filled area.
It accepts a ``inner_radius`` and ``outer_radius`` instead of just ``radius``:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.annular_wedge(x=[1, 2, 3], y=[1, 2, 3], inner_radius=0.1, outer_radius=0.25,
                    start_angle=0.4, end_angle=4.8, color="green", alpha=0.6)

    show(p)

Finally, the |annulus| glyph methods, which accepts ``inner_radius`` and
``outer_radius``, can be used to draw filled rings:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    p = figure(width=400, height=400)
    p.annulus(x=[1, 2, 3], y=[1, 2, 3], inner_radius=0.1, outer_radius=0.25,
              color="orange", alpha=0.6)

    show(p)

.. _userguide_plotting_quadratic_cubic_curves:

Specialized Curves
~~~~~~~~~~~~~~~~~~

Bokeh also provides |quadratic| and |bezier| glyph methods for drawing
parameterized quardratic and cubic curves. These are somewhat uncommon,
please refer to the reference documentation linked above for details.

.. _userguide_plotting_multiple_glyphs:

Combining Multiple Glyphs
-------------------------

Combining multiple glyphs on a single plot is a matter of calling more than
one glyph method on a single |Figure|:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    x = [1, 2, 3, 4, 5]
    y = [6, 7, 8, 7, 3]

    output_file("multiple.html")

    p = figure(plot_width=400, plot_height=400)

    # add both a line and circles on the same plot
    p.line(x, y, line_width=2)
    p.circle(x, y, fill_color="white", size=8)

    show(p)

This principle holds in general for all the glyph methods in
|bokeh.plotting|. Any number of glyphs may be added to a Bokeh
plot.

.. _userguide_plotting_setting_ranges:

Setting Ranges
--------------

By default, Bokeh will attempt to automatically set the data bounds
of plots to fit snugly around the data. Sometimes you may need to
set a plot's range explicitly. This can be accomplished by setting the
``x_range`` or ``y_range`` properties using a ``Range1d`` object that
gives the *start* and *end* points of the range you want:

.. code-block:: python

    p.x_range = Range1d(0, 100)

As a convenience, the |figure| function can also accept tuples of
*(start, end)* as values for the ``x_range`` or ``y_range`` parameters.
Below is a an example that shows both methods of setting the range:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.models import Range1d

    output_file("title.html")

    # create a new plot with a range set with a tuple
    p = figure(plot_width=400, plot_height=400, x_range=(0, 20))

    # set a range using a Range1d
    p.y_range = Range1d(0, 15)

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_plotting_axis_types:

Specifying Axis Types
---------------------

All the examples above use the default linear axis. This axis is suitable
for many plots that need to show numerical data on a linear scale. In other
cases you may have categorical data, or need to display numerical data on
a datetime or log scale. This section shows how to specify the axis type
when using |bokeh.plotting| interface.

.. _userguide_plotting_categorical_axes:

Categorical Axes
~~~~~~~~~~~~~~~~

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    factors = ["a", "b", "c", "d", "e", "f", "g", "h"]
    x =  [50, 40, 65, 10, 25, 37, 80, 60]

    output_file("categorical.html")

    p = figure(y_range=factors)

    p.circle(x, factors, size=15, fill_color="orange", line_color="green", line_width=3)

    show(p)

.. _userguide_plotting_datetime_axes:

Datetime Axes
~~~~~~~~~~~~~

When dealing with timeseries data, or any data that involves dates or
times, it is desirable to have an axis that can display labels that
are appropriate to different date and time scales.

.. note::
    This example requires a network connection, and depends on the
    open source Pandas library in order to more easily present realistic
    timeseries data.

We have seen how to use the |figure| function to create plots using the
|bokeh.plotting| interface. This function accepts  ``x_axis_type`` and
``y_axis_type`` as arguments. To specify a datetime axis, pass ``"datetime"``
for the value of either of these parameters.

.. bokeh-plot::
    :source-position: above

    import pandas as pd
    from bokeh.plotting import figure, output_file, show

    AAPL = pd.read_csv(
        "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
        parse_dates=['Date']
    )

    output_file("datetime.html")

    # create a new plot with a datetime axis type
    p = figure(width=800, height=250, x_axis_type="datetime")

    p.line(AAPL['Date'], AAPL['Close'], color='navy', alpha=0.5)

    show(p)

.. note::
    Future versions of Bokeh will attempt to auto-detect situations when
    datetime axes are appropriate, and add them automatically by default.

.. _userguide_plotting_log_axes:

Log Scale Axes
~~~~~~~~~~~~~~

When dealing with data that grows quicks (e.g., exponentially), it is often
desired to plot one axis on a log scale. Another use-scenario involves
fitting data to a power law, in which case is it desired to plot with both
axes on a log scale.

As we saw above, the |figure| function accepts ``x_axis_type`` and
``y_axis_type`` as arguments. To specify a log axis, pass ``"log"`` for
the value of either of these parameters.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    x = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
    y = [10**xx for xx in x]

    output_file("log.html")

    # create a new plot with a log axis type
    p = figure(plot_width=400, plot_height=400,
               y_axis_type="log", y_range=(10**-1, 10**4))

    p.line(x, y, line_width=2)
    p.circle(x, y, fill_color="white", size=8)

    show(p)

.. _userguide_plotting_twin_axes:

Twin Axes
~~~~~~~~~

It is possible to add multiple axes representing different ranges to a single
plot. To do this, configure the plot with "extra" named ranges in the
``extra_x_range`` and ``extra_y_range`` properties. Then these named ranges
can be referred to when adding new glyph methods, and also to add new axes
objects using the ``add_layout`` method on |Plot|. An example is given
below:

.. bokeh-plot::
    :source-position: above

    from numpy import pi, arange, sin, linspace

    from bokeh.plotting import *
    from bokeh.models import LinearAxis, Range1d

    x = arange(-2*pi, 2*pi, 0.1)
    y = sin(x)
    y2 = linspace(0, 100, len(y))

    output_file("twin_axis.html")

    p = figure(x_range=(-6.5, 6.5), y_range=(-1.1, 1.1))

    p.circle(x, y, color="red")

    p.extra_y_ranges = {"foo": Range1d(start=0, end=100)}
    p.circle(x, y2, color="blue", y_range_name="foo")
    p.add_layout(LinearAxis(y_range_name="foo"), 'left')

    show(p)

Adding Legends
--------------

It is also possible to create legends easily by specifying a legend argument
to the glyph methods, when creating a plot.

.. note::
    This example depends on the open source NumPy library in order to more
    easily generate better data suitable for demonstrating legends.

.. bokeh-plot::
    :source-position: above

    import numpy as np
    from bokeh.plotting import *

    x = np.linspace(0, 4*np.pi, 100)
    y = np.sin(x)

    output_file("legend.html")

    p = figure()

    p.circle(x, y, legend="sin(x)")
    p.line(x, y, legend="sin(x)")

    p.line(x, 2*y, legend="2*sin(x)",
        line_dash=[4, 4], line_color="orange", line_width=2)

    p.square(x, 3*y, legend="3*sin(x)", fill_color=None, line_color="green")
    p.line(x, 3*y, legend="3*sin(x)", line_color="green")

    show(p)


.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |Figure| replace:: :class:`~bokeh.plotting.Figure`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |annular_wedge|     replace:: :func:`~bokeh.plotting.Figure.annular_wedge`
.. |annulus|           replace:: :func:`~bokeh.plotting.Figure.annulus`
.. |arc|               replace:: :func:`~bokeh.plotting.Figure.arc`
.. |asterisk|          replace:: :func:`~bokeh.plotting.Figure.asterisk`
.. |bezier|            replace:: :func:`~bokeh.plotting.Figure.bezier`
.. |circle|            replace:: :func:`~bokeh.plotting.Figure.circle`
.. |circle_cross|      replace:: :func:`~bokeh.plotting.Figure.circle_cross`
.. |circle_x|          replace:: :func:`~bokeh.plotting.Figure.circle_x`
.. |cross|             replace:: :func:`~bokeh.plotting.Figure.cross`
.. |diamond|           replace:: :func:`~bokeh.plotting.Figure.diamond`
.. |diamond_cross|     replace:: :func:`~bokeh.plotting.Figure.diamond_cross`
.. |inverted_triangle| replace:: :func:`~bokeh.plotting.Figure.inverted_triangle`
.. |image|             replace:: :func:`~bokeh.plotting.Figure.image`
.. |image_rgba|        replace:: :func:`~bokeh.plotting.Figure.image_rgba`
.. |image_url|         replace:: :func:`~bokeh.plotting.Figure.image_url`
.. |line|              replace:: :func:`~bokeh.plotting.Figure.line`
.. |multi_line|        replace:: :func:`~bokeh.plotting.Figure.multi_line`
.. |oval|              replace:: :func:`~bokeh.plotting.Figure.oval`
.. |patch|             replace:: :func:`~bokeh.plotting.Figure.patch`
.. |patches|           replace:: :func:`~bokeh.plotting.Figure.patches`
.. |quad|              replace:: :func:`~bokeh.plotting.Figure.quad`
.. |quadratic|         replace:: :func:`~bokeh.plotting.Figure.quadratic`
.. |ray|               replace:: :func:`~bokeh.plotting.Figure.ray`
.. |rect|              replace:: :func:`~bokeh.plotting.Figure.rect`
.. |segment|           replace:: :func:`~bokeh.plotting.Figure.segment`
.. |square|            replace:: :func:`~bokeh.plotting.Figure.square`
.. |square_cross|      replace:: :func:`~bokeh.plotting.Figure.square_cross`
.. |square_x|          replace:: :func:`~bokeh.plotting.Figure.square_x`
.. |triangle|          replace:: :func:`~bokeh.plotting.Figure.triangle`
.. |wedge|             replace:: :func:`~bokeh.plotting.Figure.wedge`
.. |x|                 replace:: :func:`~bokeh.plotting.Figure.x`
