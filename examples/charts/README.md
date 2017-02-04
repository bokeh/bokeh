This directory includes examples that use the high level [`bokeh.charts`](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html)
interface. This interface can be used to easily build [histograms](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#histograms),
[bar charts](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#bar-charts),
[box plots](http://bokeh.pydata.org/en/latest/docs/user_guide/charts.html#box-plots), and other common statistical
and scientific charts.

A simple, but complete runnable example of typical usage looks like:

    from bokeh.charts import BoxPlot, output_file, show
    from bokeh.sampledata.autompg import autompg as df

    title = "MPG by Cylinders and Data Source, Colored by Cylinders"

    box_plot = BoxPlot(df, label=['cyl', 'origin'], values='mpg', color='cyl', title=title)

    output_file("boxplot.html")

    show(box_plot)

There are two subdirectories:

* `file` examples that output to static HTML files

* `server` examples related to Bokeh server applications

The example code for charts using Jupyter/Ipython notebooks is located under
[examples/howto/charts](https://github.com/bokeh/bokeh/tree/master/examples/howto/charts). Many
of the examples there also contain explanatory discussion of various different chart options.
