.. _tutorial_plotting:

Plotting with Basic Glyphs
==========================

.. contents::
    :local:
    :depth: 2

Creating Figures
----------------

Note that Bokeh plots created using the |bokeh.plotting| interface come with
a default set of tools, and default visual styles. See :ref:`tutorial_styling`
for information about how to customize the visual style of plots, and
:ref:`tutorial_tools` for information about changing or specifying tools.

Scatter Markers
~~~~~~~~~~~~~~~

To scatter circle markers on a plot, use the |circle| method of |Figure|:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # output to static HTML file
    output_file("line.html")

    # create a new plot with a title and axis labels
    p = figure(plot_width=400, plot_height=400, title=None)

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

    # create a new plot with a title and axis labels
    p = figure(plot_width=400, plot_height=400, title=None)

    # add a square renderer with a size, color, and alpha
    p.square([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="olive", alpha=0.5)

    # show the results
    show(p)

There are lots of marker types available in Bokeh, you can see the details
of all of them below:

.. hlist::
    :columns: 3

    * |arc|
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

Now you have learned how to plot scatter markers with the |bokeh.plotting|
interface.

Lines
~~~~~


.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("line.html")

    p = figure(plot_width=400, plot_height=400, title=None)

    # add a line renderer
    p.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=2)

    show(p)

Now you have learned how to plot single or multiple line glyphs
on Bokeh plots with the |bokeh.plotting| interface.

Patches
~~~~~~~

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("patch.html")

    p = figure(plot_width=400, plot_height=400, title=None)

    # add a patch renderer with an alpha an line width
    p.patch([1, 2, 3, 4, 5], [6, 7, 8, 7, 3], alpha=0.5, line_width=2)

    show(p)

Images
~~~~~~

Now you have learned how to plot images on Bokeh plots with the
|bokeh.plotting| interface.


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

    p = figure(plot_width=400, plot_height=400,title=None)

    # add both a line and circles on the same plot
    p.line(x, y, line_width=2)
    p.circle(x, y, fill_color="white", size=8)

    show(p)

This principle holds in general for all the glyph methods in
|bokeh.plotting|. You can add as many glyphs to a plot as you need.

Specifying Axis Types
---------------------

All the examples above use the default linear axis. This axis is suitable
for many plots that need to show numerical data on a linear scale. In other
cases you may have categorical data, or need to display numerical data on
a datetime or log scale. This section shows how specify the axis type
when using |bokeh.plotting| interface.

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

Datetime Axes
~~~~~~~~~~~~~

When dealing with timeseries data, or any data that involves dates or
times, it is desirable to have an axis that can display labels that
are appropriate to different date and time scales. In this section you
will learn how to specify that a plot should use a datetime axis.

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
    p = figure(width=800, height=250, x_axis_type="datetime", title=None)

    p.line(AAPL['Date'], AAPL['Close'], color='navy', alpha=0.5)

    show(p)

Now you have learned how to specify a datetime axis for a Bokeh plot.

.. note::
    Future versions of Bokeh will attempt to auto-detect situations when
    datetime axes are appropriate, and add them automatically by default.

Log Scale Axes
~~~~~~~~~~~~~~

When dealing with data that grows quicks (e.g., exponentially), it is often
desired to plot one axis on a log scale. Another use-scenario involves
fitting data to a power law, in which case is it desired to plot with both
axes on a log scale. In this section you will learn how to specify a
log axis type for a Bokeh plot.

As we saw above, the |figure| function accepts ``x_axis_type`` and
``y_axis_type`` as arguments. To specify a log axis, pass ``"log"`` for
the value of either of these parameters.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    x = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
    y = [10**x for x in x]

    output_file("log.html")

    # create a new plot with a log axis type
    p = figure(plot_width=400, plot_height=400,
               y_axis_type="log", y_range=(10**-1, 10**4), title=None)

    p.line(x, y, line_width=2)
    p.circle(x, y, fill_color="white", size=8)

    show(p)

Now you have learned how to specify a log scale axis for a Bokeh plot.


.. Twin Axes
.. ~~~~~~~~~


.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Figure| replace:: :class:`~bokeh.plotting.Figure`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |arc|               replace:: :func:`~bokeh.plotting.Figure.arc`
.. |asterisk|          replace:: :func:`~bokeh.plotting.Figure.asterisk`
.. |circle|            replace:: :func:`~bokeh.plotting.Figure.circle`
.. |circle_cross|      replace:: :func:`~bokeh.plotting.Figure.circle_cross`
.. |circle_x|          replace:: :func:`~bokeh.plotting.Figure.circle_x`
.. |cross|             replace:: :func:`~bokeh.plotting.Figure.cross`
.. |diamond|           replace:: :func:`~bokeh.plotting.Figure.diamond`
.. |diamond_cross|     replace:: :func:`~bokeh.plotting.Figure.diamond_cross`
.. |inverted_triangle| replace:: :func:`~bokeh.plotting.Figure.inverted_triangle`
.. |square|            replace:: :func:`~bokeh.plotting.Figure.square`
.. |square_cross|      replace:: :func:`~bokeh.plotting.Figure.square_cross`
.. |square_x|          replace:: :func:`~bokeh.plotting.Figure.square_x`
.. |triangle|          replace:: :func:`~bokeh.plotting.Figure.triangle`
.. |x|                 replace:: :func:`~bokeh.plotting.Figure.x`