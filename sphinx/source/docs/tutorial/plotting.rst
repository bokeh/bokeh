.. _tutorial_plotting:

Plotting with Basic Glyphs
==========================

.. contents::
    :local:
    :depth: 2

Creating Figures
----------------

Markers and Scatters
''''''''''''''''''''

Lines
'''''

**GOAL**: To learn how to create line plots

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y = [6, 7, 2, 4, 5]

    # output to static HTML file
    output_file("lines.html", title="line plot example")

    # create a new plot with a title and axis labels
    p = figure(title="simple line example", x_axis_label='x', y_axis_label='y',
               plot_width=400, plot_height=400)

    # add a line renderer with legend and line thickness
    p.line(x, y, legend="Temp.", line_width=2)

    # show the results
    show(p)

With this small example, we have learned the basics of creating plots with Bokeh.

Patches
'''''''


Configuring Axes
----------------


Date and Time axes
''''''''''''''''''

**GOAL**: To learn how to specify datetime axes on a plot

.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.plotting import figure, output_file, show
    from bokeh.sampledata.stocks import AAPL

    # prepare some data
    aapl = np.array(AAPL['adj_close'])
    aapl_dates = np.array(AAPL['date'], dtype=np.datetime64)

    window_size = 30
    window = np.ones(window_size)/float(window_size)
    aapl_avg = np.convolve(aapl, window, 'same')

    # output to static HTML file
    output_file("stocks.html", title="stocks.py example")

    # create a new plot with a a datetime axis type
    p = figure(width=800, height=350, x_axis_type="datetime")

    # add renderers
    p.circle(aapl_dates, aapl, size=4, color='darkgrey', alpha=0.2, legend='close')
    p.line(aapl_dates, aapl_avg, color='navy', legend='avg')

    # NEW: customize by setting attributes
    p.title = "AAPL One-Month Average"
    p.legend.orientation = "top_left"
    p.grid.grid_line_alpha=0
    p.xaxis.axis_label = 'Date'
    p.yaxis.axis_label = 'Price'
    p.ygrid.band_fill_color="olive"
    p.ygrid.band_fill_alpha = 0.1

    # show the results
    show(p)

Now we have learned...

Log Scale Axes
''''''''''''''


Twin Axes
'''''''''
