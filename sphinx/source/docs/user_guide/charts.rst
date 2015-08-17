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

``height`` *(int)* : the height of your plot in pixels.

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

.. bokeh-plot:: source/docs/user_guide/source_examples/chart_area_line_step.py
    :source-position: above

With this small example, we have learned the basics of creating a Line chart with Bokeh. Try
running the code and changing the Line function with Area or Step to create other chart types.


Bar and Dot Charts
~~~~~~~~~~~~~~~~~~

Although the nature of Bar and Dot charts differs somewhat from those in the previous paragraph,
they can be created in exactly the same way.  Below is the code to create a Bar chart with the
same data as the previous example. Worth mentioning is that the only changes are the chart function and
the definition of the category names.

.. bokeh-plot:: source/docs/user_guide/source_examples/chart_bar_dot.py
    :source-position: above

With this small example, we have learned the basics of creating a Bar chart with Bokeh. Try
running the code and changing the Bar function with Dot to create other chart types.

BoxPlot
~~~~~~~

.. bokeh-plot:: source/docs/user_guide/source_examples/chart_box.py
    :source-position: above

With this small example, we have learned the basics of creating a BoxPlot chart with Bokeh.

HeatMap
~~~~~~~

.. bokeh-plot:: source/docs/user_guide/source_examples/chart_heatmap.py
    :source-position: above

With this small example, we have learned the basics of creating a HeatMap chart with Bokeh.


Donut
~~~~~

.. bokeh-plot:: source/docs/user_guide/source_examples/chart_donut.py
    :source-position: above

With this small example, we have learned the basics of creating a Donut chart with Bokeh.


TimeSeries
~~~~~~~~~~

.. bokeh-plot:: source/docs/user_guide/source_examples/chart_timeseries.py
    :source-position: above

You can also easily plot multiple timeseries together, and add a legend by
passing ``legend=True`` to the chart function:

.. bokeh-plot:: source/docs/user_guide/source_examples/chart_timeseries_with_legend.py
    :source-position: above

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
