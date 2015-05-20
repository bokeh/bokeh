.. _userguide_charts:

Using High-level Charts
=======================

.. contents::
    :local:
    :depth: 2

.. _userguide_charts_generic_arguments:

Generic Arguments
-----------------

All charts support a set of common arguments:


``title`` *(str)* : the title of your chart.

``xlabel`` *(str)* : the x-axis label of your chart.

``ylabel`` *(str)* : the y-axis label of your chart.

``legend`` *(str, bool)* : the legend of your chart.

``xscale`` *(str)* : the x-axis type scale of your chart.

``yscale`` *(str)* : the y-axis type scale of your chart.

``xgrid`` *(bool)* : whether to draw an x-grid.

``ygrid`` *(bool)* : whether to draw an y-grid.

``width`` *(int)* : the width of your plot in pixels.

``height`` *(int)* : the height of you plot in pixels.

``tools`` *(str or bool)* : to enable or disable the tools in your chart.

``palette`` *(list)* : a list containing the colormap as hex values.

``filename`` *(str or bool)* : the name of the file where your chart will be written.

``server`` *(str or bool)* : the name of your chart in the server.

``notebook`` *(bool)* : whether to output inline in the IPython notebook.

Creating Charts
---------------

With the next examples, we'll learn the basics of using `bokeh.charts` to create
rich charts commonly used without having to access lower level components.

Area, Line and Step Charts
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import Line, Step, output_file, show

    # prepare some data
    data = {"y": [6, 7, 2, 4, 5], "z": [1, 5, 12, 4, 2]}

    # output to static HTML file
    output_file("lines.html", title="line plot example")

    # create a new line chat with a title and axis labels
    p = Line(data, title="simple line example", xlabel='x', ylabel='values', width=400, height=400)

    # show the results
    show(p)

With this small example, we have learned the basics of creating a Line chart with Bokeh. Try
running the code and changing the Line function with Area or Step to create other chart types.


Bar and Dot Charts
~~~~~~~~~~~~~~~~~~

Although the nature of Bar and Dot charts differs somewhat from those in the previous paragraph,
they can be created in exactly the same way.  Below is the code to create a Bar chart with the
same data as the previous example. Worth mentioning is that the only changes are the chart function and
the definition of the category names.

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import Bar, output_file, show

    # prepare some data
    data = {"y": [6, 7, 2, 4, 5], "z": [1, 5, 12, 4, 2]}

    # output to static HTML file
    output_file("bar.html")

    # create a new line chat with a title and axis labels
    p = Bar(data, cat=['C1', 'C2', 'C3', 'D1', 'D2'], title="Bar example",
        xlabel='categories', ylabel='values', width=400, height=400)

    # show the results
    show(p)

With this small example, we have learned the basics of creating a Bar chart with Bokeh. Try
running the code and changing the Bar function with Dot to create other chart types.

BoxPlot
~~~~~~~

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import BoxPlot, output_file, show

    # prepare some data
    data = {"y": [6, 7, 2, 4, 5], "z": [1, 5, 12, 4, 2]}

    # output to static HTML file
    output_file("box.html", title="boxplot example")

    # create a new line chat with a title and axis labels
    p = BoxPlot(data, title="BoxPlot", width=400, height=400)

    # show the results
    show(p)

With this small example, we have learned the basics of creating a BoxPlot chart with Bokeh.

HeatMap
~~~~~~~

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import HeatMap, output_file, show

    import pandas as pd

    output_file('heatmap.html')

    df = pd.DataFrame(
        dict(
            apples=[4,5,8],
            bananas=[1,2,4],
            pears=[6,5,4],
        ),
        index=['2012', '2013', '2014']
    )

    p = HeatMap(df, title='Fruits')

    show(p)

With this small example, we have learned the basics of creating a HeatMap chart with Bokeh.


Donut
~~~~~

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import Donut, output_file, show

    output_file('donut.html')

    # prepare the data
    data = [[2., 5., 3.], [4., 1., 4.], [6., 4., 3.]]

    donut = Donut(data, ['cpu1', 'cpu2', 'cpu3'])

    show(donut)

With this small example, we have learned the basics of creating a Donut chart with Bokeh.


TimeSeries
~~~~~~~~~~

.. bokeh-plot::
    :source-position: above

    import pandas as pd
    from bokeh.charts import TimeSeries, output_file, show

    AAPL = pd.read_csv(
        "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
        parse_dates=['Date'])

    output_file("timeseries.html")

    data = dict(AAPL=AAPL['Adj Close'], Date=AAPL['Date'])

    p = TimeSeries(data, index='Date', title="APPL", ylabel='Stock Prices')

    show(p)

You can also easily plot multiple timeseries together, and add a legend by
passing ``legend=True`` to the chart function:

.. bokeh-plot::
    :source-position: above

    import pandas as pd

    from bokeh.charts import TimeSeries, show, output_file

    # read in some stock data from the Yahoo Finance API
    AAPL = pd.read_csv(
        "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
        parse_dates=['Date'])
    MSFT = pd.read_csv(
        "http://ichart.yahoo.com/table.csv?s=MSFT&a=0&b=1&c=2000&d=0&e=1&f=2010",
        parse_dates=['Date'])
    IBM = pd.read_csv(
        "http://ichart.yahoo.com/table.csv?s=IBM&a=0&b=1&c=2000&d=0&e=1&f=2010",
        parse_dates=['Date'])

    xyvalues = pd.DataFrame(dict(
        AAPL=AAPL['Adj Close'],
        Date=AAPL['Date'],
        MSFT=MSFT['Adj Close'],
        IBM=IBM['Adj Close'],
    ))

    output_file("stocks_timeseries.html")

    p = TimeSeries(xyvalues, index='Date', legend=True,
                   title="Stocks", ylabel='Stock Prices')

    show(p)

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
