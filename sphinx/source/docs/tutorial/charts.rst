.. _tutorial_charts:

Using High-level Charts
=======================

.. contents::
    :local:
    :depth: 2

Creating Charts
---------------

With the next examples, we'll the basics of using `bokeh.charts` to create
rich charts commonly used without having to access lower level components.

Area, Line and Step Charts
''''''''''''''''''''''''''

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import Area, Line, Step, output_file, show

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
''''''''''''''''''

Although the different nature of Bar and Dot charts comparing to the ones we have seen in the
previous paragraph, those charts can be created exactly in the same way.
Below is the code to create a Bar chart with the same data of the previous example. Worth
mentioning the that only change is the chart function and the definition of the category names.

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import Bar, Dot, output_file, show

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
'''''''

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
'''''''

.. bokeh-plot::
    :source-position: above

    from bokeh.charts import HeatMap, output_file, show
    from collections import OrderedDict
    import pandas as pd
    output_file('heatmap.html')

    # prepare some data
    data = OrderedDict()
    data['apples'] = [4,5,8]
    data['bananas'] = [1,2,4]
    data['pears'] = [6,5,4]
    df = pd.DataFrame(data, index=['2012', '2013', '2014'])

    p = HeatMap(df, title='Fruits')
    # show the results
    show(p)

With this small example, we have learned the basics of creating a HeatMap chart with Bokeh.


Donut
'''''

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
''''''''''

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
