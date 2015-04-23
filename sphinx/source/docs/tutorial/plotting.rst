.. _tutorial_plotting:

Plotting with Basic Glyphs
==========================

.. contents::
    :local:
    :depth: 2

Creating Figures
----------------

Scatter Markers
~~~~~~~~~~~~~~~


Now you have learned how to plot scatter markers with the
|bokeh.plotting| interface.

Images
~~~~~~

Now you have learned how to plot images on Bokeh plots with the
|bokeh.plotting| interface.

Lines
~~~~~

**GOAL**: To learn how to create line plots

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # output to static HTML file
    output_file("line.html")

    # create a new plot with a title and axis labels
    p = figure(plot_width=400, plot_height=400, title=None)

    # add a line renderer with legend and line thickness
    p.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=2)

    # show the results
    show(p)

Now you have learned how to plot single or multiple line glyphs
on Bokeh plots with the |bokeh.plotting| interface.

Patches
~~~~~~~


Specify Axis Types
------------------


Categorical Axes
~~~~~~~~~~~~~~~~


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
    p = figure(width=800, height=350, x_axis_type="datetime")

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
    p = figure(y_axis_type="log", y_range=(10**-1, 10**4), title=None)

    p.line(x, y, line_width=2)
    p.circle(x, y, fill_color="white", size=8)

    show(p)

Now you have learned how to specify a log scale axis for a Bokeh plot.


Twin Axes
~~~~~~~~~


.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |figure| replace:: :func:`~bokeh.plotting.figure`
