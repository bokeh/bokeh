.. _userguide_charts:

High Level Charts
=================

.. contents::
    :local:
    :depth: 2

.. warning:: ``bokeh.charts`` interface is still experimental an is very likely to change in the
  next upcoming releases. Although we will always try to be consistent we cannot guarantee
  backwards compatibility for now. Please take this into consideration when using it.

The main idea behind the ``bokeh.charts`` interface is to help the users to easily get their plot
using a very high level API.

Currently the ``bokeh.charts`` interface supports the following chart types:

* ``Area`` (overlapped and stacked)
* ``Bar`` (grouped and stacked)
* ``BoxPlot``
* ``Donut``
* ``Dot``
* ``HeatMap``
* ``Histogram``
* ``Line``
* ``Scatter``
* ``Step``
* ``Timeseries``


To use them, you only have to import the ``Bokeh`` chart of interest from ``bokeh.charts``::

    from bokeh.charts import Histogram

initialize your plot with some specific arguments (for chart customization)::

    mu, sigma = 0, 0.5
    normal = np.random.normal(mu, sigma, 1000)
    normal_dist = OrderedDict(normal=normal)
    hist = Histogram(normal_dist, bins=50, mu=mu, sigma=sigma,
                     title="kwargs, dict_input", ylabel="frequency", legend="top_left",
                     width=400, height=350, notebook=True)

and finally call the ``show()`` method::

    hist.show()

.. image:: /_images/charts_histogram_cdf.png
    :align: center

.. _charts_generic_arguments:

Generic arguments and chained methods
-------------------------------------

Charts support a long list of arguments that you can pass when instantiating a class, as we have shown before,
but you can also use chained methods to set those attributes as in the following example::

    hist = Histogram(distributions, bins=50, notebook=True)
    hist.title("chained_methods, dict_input").ylabel("frequency").legend(True).width(400).height(350).show()

.. note:: Be aware that the ``show()`` method can not be chained. It has to be called at the end of your chain.

Available arguments and chained methods are:

* ``title`` (str): the title of your plot.
* ``xlabel`` (str): the x-axis label of your plot.
* ``ylabel`` (str): the y-axis label of your plot.
* ``legend`` (str, bool): the legend of your plot.
* ``xscale`` (str): the x-axis type scale of your plot.
* ``yscale`` (str): the y-axis type scale of your plot.
* ``width`` (int): the width of your plot in pixels.
* ``height`` (int): the height of you plot in pixels.
* ``tools`` (bool): to enable or disable the tools in your plot.
* ``filename`` (str or bool): the name of the file where your plot will be written.
* ``server`` (str or bool): the name of your plot in the server.
* ``notebook`` (bool):if you want to output (or not) your plot into the IPython notebook.

You can check the docstring of each method to get more information.

.. _charts_interface_inputs:

Interface inputs
----------------

The ``bokeh.charts`` interface is ready to get your input as essentially any of the following:

* ``list``
* ``dict``
* ``OrderedDict``
* numpy ``arrays``
* pandas ``DataFrame objects``

In general elements are supposed to be iterables representing each single data series values
(i.e: list of lists, dict/ordered dict of lists, etc.. containing scalar values).
The idea behind this canonical format is to easily represent groups of data and easily plot
them through the interface.

.. note:: Scatter chart also supports pandas ``groupby objects`` as input. As we have mentioned
``Charts`` is still very experimental so the number of supported inputs is very likely to grow.


Let see some examples using different kind of inputs:


* Using a pandas ``groupby`` object (only supported by Scatter)::

    from bokeh.sampledata.iris import flowers
    from bokeh.charts import Scatter

    df = flowers[["petal_length", "petal_width", "species"]]
    g = df.groupby("species")

    scatter = Scatter(g, filename="iris_scatter.html").title("iris dataset").legend("top_left")
    scatter.width(600).height(400).show()

* Using ``OrderedDict`` (or dict-like objects)::

    from collections import OrderedDict

    xyvalues = OrderedDict()
    for i in ['setosa', 'versicolor', 'virginica']:
        x = getattr(g.get_group(i), 'petal_length')
        y = getattr(g.get_group(i), 'petal_width')
        xyvalues[i] = list(zip(x, y))

    scatter = Scatter(xyvalues, filename="iris_scatter.html").title("iris dataset").legend("top_left")
    scatter.width(600).height(400).show()


* Using a ``hierarchical`` pandas ``dataframe``::

    import pandas as pd

    dfvalues = pd.DataFrame(xyvalues)

    scatter = Scatter(dfvalues, filename="iris_scatter.html").title("iris dataset").legend("top_left")
    scatter.width(600).height(400).show()



* Using a ``list``::

    lxyvalues = xyvalues.values()

    scatter = Scatter(lxyvalues, filename="iris_scatter.html").title("iris dataset").legend("top_left")
    scatter.width(600).height(400).show()

* Using a numpy ``array``::

    import numpy as np

    nxyvalues = np.array(xyvalues.values())

    scatter = Scatter(nxyvalues, filename="iris_scatter.html").title("iris dataset").legend("top_left")
    scatter.width(600).height(400).show()


As you can see, in the first three cases, we inferred the ``x`` and ``y``
labels from the received object, so don't need to specify them by yourself. This is
done whenever possible. The following image shows the result:

.. image:: /_images/charts_scatter_w_labels.png
    :align: center

When that's not possible (like the last two examples using a ``list`` and a numpy ``array``) ``Charts``
will create a new figure without the inferred labels like the following:

.. image:: /_images/charts_scatter_no_labels.png
    :align: center


In general ``Charts`` have standard inputs, like we have showed earlier but as we'll see
in the next paragraph, some charts types still need specific inputs  to work effectively
due to their own specific nature.

Specific arguments
------------------

For some chart types we support specific arguments which only make sense in that
specific chart context. For instance, if you use a Timeseries chart, the x-value (index) for each group has
to be datetime values. Or, if you want to use the Categorical HeatMap, columns names and the specified
index have to be string type values.

Going ahead with a few more examples: as you have seen before, in the Histogram chart you need to set
up the ``bins`` and, additionally, you can pass a ``mu`` and ``sigma`` to get the ``pdf`` and the ``cdf``
line plots of theoretical normal distributions for these parameters.

In the Bar charts case, if you pass several groups, they will be shown ``grouped`` by default:

.. image:: /_images/charts_bar_grouped.png
    :align: center

But if you specify the argument ``stacked`` as True, it will be shown as stacked bars as follows:

.. image:: /_images/charts_bar_stacked.png
    :align: center

|

So, besides the shared arguments specified in :ref:`charts_generic_arguments` and the general
:ref:`charts_interface_inputs` we have listed in the previous paragraph, each class support the
following custom arguments:


Area
~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort, optional): can be used to specify a common custom index for all data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)

* ``facet`` (bool, optional): generate multiple areas on multiple separate plots for each series if ``True``. Defaults to ``False``
* ``stacked`` (bool, optional):

  * ``True``: areas are draw as a stack to show the relationship of parts to a whole
  * ``False``: areas are layered on the same chart figure. Defaults to ``False``.


.. image:: /_images/charts_area_stacked.png
    :align: left
    :width: 400px
    :height: 400px

.. image:: /_images/charts_area_layered.png
    :align: right
    :width: 400px
    :height: 400px


Bar
~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``cat`` (list, optional): list of string representing the categories. Defaults to None.
* ``facet`` (bool, optional): generate multiple areas on multiple separate plots for each series if ``True``. Defaults to ``False``.
* ``stacked`` (bool, optional):

  * ``True``: bars are draw as a stack to show the relationship of parts to a whole.
  * ``False``: bars are groupped on the same chart figure. Defaults to ``False``.


.. image:: /_images/charts_bar_stacked.png
    :align: left
    :width: 400px
    :height: 400px

.. image:: /_images/charts_bar_grouped.png
    :align: right
    :width: 400px
    :height: 400px


BoxPlot
~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``marker`` (int or string, optional): the marker type to use if outliers=True (e.g., `circle`). Defaults to `circle`.
* ``outliers`` (bool, optional): whether or not to plot outliers. Defaults to ``True``.

.. image:: /_images/charts_boxplot.png
    :align: center
    :width: 600px
    :height: 400px



Donut
~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``palette`` (list, optional): a list containing the colormap as hex values.

.. image:: /_images/charts_donut.png
    :align: center
    :width: 400px
    :height: 400px


Dot
~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``cat`` (list, optional): list of string representing the categories. Defaults to None.
* ``facet`` (bool, optional): generate multiple dots on multiple separate plots for each series if ``True``. Defaults to ``False``.

.. image:: /_images/charts_dots.png
    :align: center
    :width: 600px
    :height: 400px


HeatMap
~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``cat`` (list, optional): list of string representing the categories. Defaults to None.

.. image:: /_images/charts_heatmap.png
    :align: center
    :width: 600px
    :height: 400px


Histogram
~~~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``bins`` (int): number of bins to use when building the Histogram.
* ``mu`` (float, optional): theoretical mean value for the normal distribution. Defaults to ``None``.
* ``sigma`` (float, optional): theoretical sigma value for the normal distribution. Defaults to ``None``.
* ``facet`` (bool, optional): generate multiple histograms on multiple separate plots for each series if ``True``. Defaults to ``False``

.. image:: /_images/charts_histograms.png
    :align: left
    :width: 400px
    :height: 400px

.. image:: /_images/charts_histogram_cdf.png
    :align: right
    :width: 400px
    :height: 400px


Line
~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort, optional): can be used to specify a common custom index for all chart data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)

* ``facet`` (bool, optional): generate multiple lines on multiple separate plots for each series if ``True``. Defaults to ``False``

.. image:: /_images/charts_lines.png
    :align: center
    :width: 600px
    :height: 400px


Scatter
~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of x, y pairs, like i.e.: ``[(1, 2), (2, 7), ..., (20122, 91)]``
* ``facet`` (bool, optional): generate multiple scatters on multiple separate plots for each series if ``True``. Defaults to ``False``

.. image:: /_images/charts_scatter_w_labels.png
    :align: center
    :width: 600px
    :height: 400px


Step
~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort, optional): can be used to specify a common custom index for all chart data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)

* ``facet`` (bool, optional): generate multiple stepped lines on multiple separate plots for each series if ``True``. Defaults to ``False``

.. image:: /_images/charts_steps.png
    :align: center
    :width: 600px
    :height: 400px


TimeSeries
~~~~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort of ``datetime`` values, optional): can be used to specify a common custom index for all chart data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)

* ``facet`` (bool, optional): generate multiple timeseries on multiple separate plots for each series if ``True``. Defaults to ``False``

.. image:: /_images/charts_timeseries.png
    :align: center
    :width: 600px
    :height: 400px

|

Here you can find a summary table that makes it easier to group and visualize those differences:

.. raw:: html

    <table border="0" class="table">
        <colgroup>
        <col width="8%">
        <col width="8%">
        <col width="9%">
        <col width="8%">
        <col width="8%">
        <col width="10%">
        <col width="8%">
        <col width="8%">
        <col width="9%">
        <col width="8%">
        <col width="8%">
        <col width="9%">
        </colgroup>
        <thead valign="bottom">
        <tr class="row-odd"><th class="head">Argument</th>
        <th class="head">Area</th>
        <th class="head">Bar</th>
        <th class="head">BoxPlot</th>
        <th class="head">HeatMap</th>
        <th class="head">Donut</th>
        <th class="head">Dot</th>
        <th class="head">Histogram</th>
        <th class="head">Line</th>
        <th class="head">Scatter</th>
        <th class="head">Step</th>
        <th class="head">TimeSeries</th>
        </tr>
        </thead>
        <tbody valign="top">
        <tr class="row-even"><td>values</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE"><em>Yes</em></td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        </tr>
        <tr class="row-odd"><td>index</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        </tr>
        <tr class="row-even"><td>cat</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        </tr>
        <tr class="row-odd"><td>facet</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        </tr>
        <tr class="row-even"><td>stacked</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        </tr>
        <tr class="row-odd"><td>pallette</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        </tr>
        <tr class="row-even"><td>bins</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        </tr>
        <tr class="row-odd"><td>mu</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        </tr>
        <tr class="row-even"><td>sigma</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#D4F5CE">Yes</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        <td bgcolor="#F5CECE">No</td>
        </tr>
        </tbody>
    </table>

.. note:: Scatter values are supposed to be iterables of coupled values. I.e.: ``[[(1, 20), ..., (200, 21)], ..., [(1, 12),... (200, 19)]]``

Interface outputs
-----------------

As with the low and middle level ``Bokeh`` plotting APIs, in ``bokeh.charts``,
we also support the chart output to a file::

    hist = Histogram(distributions, bins=50, filename="my_plot")

* ``filename``, string type, the name of your chart.

to the ``bokeh-server``::

    hist = Histogram(distributions, bins=50, server=True)

* ``server``, string type, the name of your chart in the server.

and to the IPython notebook::

    hist = Histogram(distributions, bins=50, notebook=True)

* ``notebook``, bool type, if you want to output (or not) to the notebook.

Keep in mind that, as with any other ``Bokeh`` plots in the IPython notebook,
you have to load the ``BokehJS`` library into the notebook just doing::

    import bokeh
    bokeh.load_notebook()

.. note:: You can output to any or all of these 3 possibilities because, right now, they are not mutually exclusive.
