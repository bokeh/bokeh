.. _userguide_charts:

High Level Charts
=================

.. contents::
    :local:
    :depth: 2

.. warning:: ``bokeh.charts`` interface is still new, and is very likely to change
    in upcoming releases. Although we always try to be consistent, we cannot guarantee
    backwards compatibility for now. Please take this into consideration when using it.


``bokeh.charts`` provides a very high level API to create rich charts commonly used without
having to access lower level components.

The current ``bokeh.charts`` interface implementation supports the following chart types:

* ``Area`` (overlapped and stacked)
* ``Bar`` (grouped and stacked)
* ``BoxPlot``
* ``Donut``
* ``Dot``
* ``HeatMap``
* ``Histogram``
* ``Horizon``
* ``Line``
* ``Scatter``
* ``Step``
* ``Timeseries``


To use them, you only have to import the chart factory of interest from ``bokeh.charts``:

.. code-block:: python

    from bokeh.charts import Histogram

initialize your plot with the chart specific arguments to customize the chart:

.. code-block:: python

    mu, sigma = 0, 0.5
    normal = np.random.normal(mu, sigma, 1000)
    normal_dist = OrderedDict(normal=normal)
    hist = Histogram(normal_dist, bins=50, mu=mu, sigma=sigma,
                     title="kwargs, dict_input", ylabel="frequency", legend="top_left",
                     width=400, height=350, notebook=True)

and finally call the ``show()`` method:


.. code-block:: python

    hist.show()

or use the plotting interface functions:

.. code-block:: python

    from bokeh.plotting import output_file, show
    output_file('histogram.html')
    show(hist)


.. image:: /_images/charts_histogram_cdf.png
    :align: center


.. _charts_generic_arguments:

Generic arguments
-----------------

Charts support a long list of arguments that you can pass when instantiating a class, as we have shown before.
Available optional arguments are:

* ``title`` (str): the title of your chart.
* ``xlabel`` (str): the x-axis label of your chart.
* ``ylabel`` (str): the y-axis label of your chart.
* ``legend`` (str, bool): the legend of your chart.
* ``xscale`` (str): the x-axis type scale of your chart.
* ``yscale`` (str): the y-axis type scale of your chart.
* ``xgrid`` (bool): whether to draw an x-grid.
* ``ygrid`` (bool): whether to draw an y-grid.
* ``width`` (int): the width of your plot in pixels.
* ``height`` (int): the height of you plot in pixels.
* ``tools`` (str or bool): to enable or disable the tools in your chart.
* ``palette`` (list): a list containing the colormap as hex values.
* ``filename`` (str or bool): the name of the file where your chart will be written.
* ``server`` (str or bool): the name of your chart in the server.
* ``notebook`` (bool):if you want to output (or not) your chart into the IPython notebook.


.. _charts_interface_inputs:

Interface inputs
----------------

``bokeh.charts`` support any of the following:

* ``list``
* ``dict``
* ``OrderedDict``
* numpy ``arrays``
* pandas ``DataFrame objects``

In general inputs are supposed to be iterables representing each single data series values
(i.e: list of lists, dict/ordered dict of lists, etc.. containing iterable of scalar values).
The idea behind this canonical format is to easily represent groups of data and easily plot
them through the interface.

.. note:: Scatter chart also supports pandas groupby objects as input. As we have
        mentioned ``bokeh.charts`` is still very experimental so the number of supported
        inputs is very likely to grow.


Here are a few examples showing charts using different kind of inputs:


* Using a pandas ``groupby`` object (only supported by Scatter)::

    from bokeh.sampledata.iris import flowers
    from bokeh.charts import Scatter

    df = flowers[["petal_length", "petal_width", "species"]]
    g = df.groupby("species")

    scatter = Scatter(g, filename="iris_scatter.html", title="iris dataset GroupBy")
    scatter.show()

* Using ``OrderedDict`` (or dict-like objects)::

    from collections import OrderedDict

    xyvalues = OrderedDict()
    for i in ['setosa', 'versicolor', 'virginica']:
        x = getattr(g.get_group(i), 'petal_length')
        y = getattr(g.get_group(i), 'petal_width')
        xyvalues[i] = list(zip(x, y))

    scatter = Scatter(xyvalues, filename="iris_scatter.html", title="iris dataset, OrderedDic")
    scatter.show()


* Using a ``hierarchical`` pandas ``dataframe``::

    import pandas as pd

    dfvalues = pd.DataFrame(xyvalues)

    scatter = Scatter(dfvalues, filename="iris_scatter.html", title="iris dataset, DataFrame")
    scatter.show()



* Using a ``list``::

    lxyvalues = xyvalues.values()

    scatter = Scatter(lxyvalues, filename="iris_scatter.html", title="iris dataset, List")
    scatter.show()

* Using a numpy ``array``::

    import numpy as np

    nxyvalues = np.array(xyvalues.values())

    scatter = Scatter(nxyvalues, filename="iris_scatter.html", title="iris dataset, Array")
    scatter.show()


All the previous examples render the chart in :ref:`charts_generic_arguments_scatter` with
the difference that numpy ``array`` and ``list`` inputs will render different legends from
mappings like ``dict``, ``OrderedDict``, pandas ``DataFrame`` or ``GroupBy`` objects
(if ``legend`` is True).


Specific arguments
------------------

For some chart types we support specific arguments which only make sense in that
specific chart context. For instance, if you use a Timeseries chart, the x-value
(index) for each group has to be datetime values. Or, if you want to use the
Categorical HeatMap, columns names and the specified index have to be string
type values.

Going ahead with a few more examples: as you have seen before, in the Histogram
chart you need to setup the ``bins`` and, additionally, you can pass a ``mu``
and ``sigma`` to get the ``pdf`` and the ``cdf`` line plots of theoretical
normal distributions for these parameters.

In the Bar charts case, if you pass several groups, they will be shown ``grouped``
by default:

.. image:: /_images/charts_bar_grouped.png
    :align: center

But if you specify the argument ``stacked`` as True, it will be shown as stacked
bars as follows:

.. image:: /_images/charts_bar_stacked.png
    :align: center

|

So, besides the shared arguments specified in :ref:`charts_generic_arguments` and
the general :ref:`charts_interface_inputs` we have listed in the previous paragraph,
each class support the following custom arguments:


Area
~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort, optional): can be used to specify a common custom index for all data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)

* ``stacked`` (bool, optional):

  * ``True``: areas are draw as a stack to show the relationship of parts to a whole
  * ``False``: areas are layered on the same chart figure. Defaults to ``False``.


Example:

.. bokeh-plot:: ../examples/charts/area.py
    :source-position: above

Bar
~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``cat`` (list, optional): list of string representing the categories. Defaults to None.
* ``stacked`` (bool, optional):

  * ``True``: bars are draw as a stack to show the relationship of parts to a whole.
  * ``False``: bars are groupped on the same chart figure. Defaults to ``False``.
* ``continuous_range`` (:ref:`Range <bokeh.models.ranges>`, optional): An explicit range for the continuous
  axis of the chart (the y-dimension).

In the case where no ``continuous_range`` object is passed, it is calculated
based on the data provided in values, according to the following rules:

* with all positive data: start = 0, end = 1.1 * max
* with all negative data: start = 1.1 * min, end = 0
* with mixed sign data:   start = 1.1 * min, end = 1.1 * max

Example:

.. bokeh-plot:: ../examples/charts/stacked_bar.py
    :source-position: above


BoxPlot
~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``marker`` (int or string, optional): the marker type to use if outliers=True (e.g., `circle`). Defaults to `circle`.
* ``outliers`` (bool, optional): whether or not to plot outliers. Defaults to ``True``.

Example:

.. bokeh-plot:: ../examples/charts/boxplot.py
    :source-position: above


Donut
~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.


Example:

.. bokeh-plot:: ../examples/charts/donut.py
    :source-position: above


Dot
~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``cat`` (list, optional): list of string representing the categories. Defaults to None.

Example:

.. bokeh-plot:: ../examples/charts/dots.py
    :source-position: above


HeatMap
~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``cat`` (list, optional): list of string representing the categories. Defaults to None.


Example:

.. bokeh-plot:: ../examples/charts/cat_heatmap.py
    :source-position: above


Histogram
~~~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``bins`` (int): number of bins to use when building the Histogram.
* ``mu`` (float, optional): theoretical mean value for the normal distribution. Defaults to ``None``.
* ``sigma`` (float, optional): theoretical sigma value for the normal distribution. Defaults to ``None``.


Example:

.. bokeh-plot:: ../examples/charts/histograms.py
    :source-position: above

Horizon
~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort, optional): can be used to specify a common custom index for all data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)

* ``num_folds`` (int, optional): number of folds stacked on top of each other. (default: 3)
* ``pos_color`` (color, optional): The color of the positive folds. Defaults to ``#006400``.
* ``neg_color`` (color, optional): The color of the negative folds. Defaults to ``#6495ed``.


Example:

.. bokeh-plot:: ../examples/charts/horizon.py
    :source-position: above


Line
~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort, optional): can be used to specify a common custom index for all chart data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)


Example:

.. bokeh-plot:: ../examples/charts/lines.py
    :source-position: above


.. _charts_generic_arguments_scatter:

Scatter
~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of x, y pairs, like i.e.: ``[(1, 2), (2, 7), ..., (20122, 91)]``


Example:

.. bokeh-plot:: ../examples/charts/iris_scatter.py
    :source-position: above


Step
~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort, optional): can be used to specify a common custom index for all chart data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)


Example:

.. bokeh-plot:: ../examples/charts/steps.py
    :source-position: above


TimeSeries
~~~~~~~~~~

* ``values`` (see :ref:`charts_interface_inputs`): data series to be plotted. Container values must be 1d iterable of scalars.
* ``index`` (str | 1d iterable of any sort of ``datetime`` values, optional): can be used to specify a common custom index for all chart data series as follows:

  * As a 1d iterable of any sort that will be used as series common index
  * As a string that corresponds to the ``key`` of the mapping to be used as index (and not as data series) if ``area.values`` is a mapping (like a ``dict``, an ``OrderedDict`` or a pandas ``DataFrame``)


Example:

.. bokeh-plot:: ../examples/charts/stocks_timeseries.py
    :source-position: above

Here you can find a summary table that makes it easier to group and visualize those differences:

.. raw:: html

    <table border="0" class="table">
        <colgroup>
        <col width="8%">
        <col width="8%">
        <col width="9%">
        <col width="8%">
        <col width="8%">
        <col width="9%">
        <col width="8%">
        <col width="8%">
        <col width="8%">
        <col width="8%">
        <col width="7%">
        <col width="7%">
        <col width="8%">
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
        <th class="head">Horizon</th>
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
        <td bgcolor="#F5CECE">No</td>
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
        <td bgcolor="#F5CECE">No</td>
        </tr>
        <tr class="row-even"><td>num_folds</td>
        <td bgcolor="#F5CECE">No</td>
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
        <tr class="row-even"><td>pos_color</td>
        <td bgcolor="#F5CECE">No</td>
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
        <tr class="row-even"><td>ned_color</td>
        <td bgcolor="#F5CECE">No</td>
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
we also support the chart output to:

* a file::

    hist = Histogram(distributions, bins=50, filename="hist.html")
    hist.show()

    # or use
    from bokeh.plotting import output_file, show
    output_file('hist.html')
    show(hist)


* to ``bokeh-server``::

    hist = Histogram(distributions, bins=50, server=True)
    hist.show()

    # or use
    from bokeh.plotting import output_server, show
    output_server('hist')
    show(hist)



* to IPython notebook::

    hist = Histogram(distributions, bins=50, notebook=True)
    hist.show()

    # or use
    from bokeh.plotting import output_notebook, show
    output_notebook()
    show(hist)

.. note:: You can output to any or all of these 3 possibilities because, right now, they are not mutually exclusive.



.. _charts_builders:

Chart Builders
--------------

Since 0.8 release `Charts` creation is streamlined by specific
objects called Builders. Builders are convenience classes that create
all computation, validation and low-level geometries needed to render a High Level
Chart. This provides clear pattern to easily extend the `Charts` interface
with new charts. For more info about this refer to  :ref:`bokeh_dot_charts_builders`
reference.
