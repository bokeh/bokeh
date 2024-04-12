.. _ug_basic_bars:

Bar charts
==========

In addition to plotting numerical data on continuous ranges, you can also use
Bokeh to plot categorical data on categorical ranges.

Basic categorical ranges are represented in Bokeh as sequences of strings. For
example, a list of the four seasons:

.. code-block:: python

    seasons = ["Winter", "Spring", "Summer", "Fall"]

Bokeh can also handle hierarchical categories. For example, you can use nested
sequences of strings to represent the individual months within each yearly
quarter:

.. code-block:: python

    months_by_quarter = [
        ("Q1", "Jan"), ("Q1", "Feb"), ("Q1", "Mar"),
        ("Q2", "Apr"), ("Q2", "May"), ("Q2", "Jun"),
        ("Q3", "Jul"), ("Q3", "Aug"), ("Q3", "Sep"),
        ("Q4", "Oct"), ("Q4", "Nov"), ("Q4", "Dec"),
    ]

Depending on the structure of your data, you can use different kinds of charts:
bar charts, categorical heatmaps, jitter plots, and others. This chapter will
present several kinds of common plot types for categorical data.

Bars
----

One of the most common ways to handle categorical data is to present it in a
bar chart. Bar charts have one categorical axis and one continuous axis. Bar
charts are useful when there is one value to plot for each category.

The values associated with each category are represented by drawing a bar for
that category. The length of this bar along the continuous axis corresponds to
the value for that category.

Bar charts may also be stacked or grouped together according to hierarchical
sub-categories. This section will demonstrate how to draw a variety of
different categorical bar charts.

.. _ug_basic_bars_basic:

Basic
~~~~~

To create a basic bar chart, use the |hbar| (horizontal bars) or |vbar|
(vertical bars) glyph methods. The example below shows a sequence of simple
1-level categories.

.. code-block:: python

    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

To assign these categories to the x-axis, pass this list as the
``x_range`` argument to |figure|.

.. code-block:: python

    p = figure(x_range=fruits, ... )

Doing so is a convenient shorthand for creating a
:class:`~bokeh.models.ranges.FactorRange` object.
The equivalent explicit notation is:

.. code-block:: python

    p = figure(x_range=FactorRange(factors=fruits), ... )

This form is useful when you want to customize the
``FactorRange``, for example, by changing the range
or category padding.

Next, call |vbar| with the list of fruit names as
the ``x`` coordinate and the bar height as the ``top``
coordinate. You can also specify ``width`` or other
optional properties.

.. code-block:: python

    p.vbar(x=fruits, top=[5, 3, 4, 2, 4, 6], width=0.9)

Combining the above produces the following output:

.. bokeh-plot:: __REPO__/examples/basic/bars/basic.py
    :source-position: above

You can also assign the data to a |ColumnDataSource|
and supply it as the ``source`` parameter to |vbar|
instead of passing the data directly as parameters.
You will see this in later examples.

.. _ug_basic_bars_sorted:

Sorting
~~~~~~~

To order the bars of a given plot, sort the categories by
value.

The example below sorts the fruit categories in ascending order
based on counts and rearranges the bars accordingly.

.. bokeh-plot:: __REPO__/examples/basic/bars/sorted.py
    :source-position: above

.. _ug_basic_bars_filled:

Filling
~~~~~~~

.. _ug_basic_bars_filled_colors:

Colors
''''''

You can color the bars in several ways:

* Supply all the colors along with the rest of the data to
  a |ColumnDataSource| and assign the name of the color column
  to the ``color`` argument of |vbar|.

  .. bokeh-plot:: __REPO__/examples/basic/bars/colors.py
    :source-position: above

  You can also use the color column with the ``line_color`` and
  ``fill_color`` arguments to change outline and fill colors,
  respectively.

* Use the ``CategoricalColorMapper`` model to map bar colors in a browser.
  You can do this with the |factor_cmap| function.

  .. code-block:: python

      factor_cmap('fruits', palette=Spectral6, factors=fruits)

  You can then pass the result of this function to the ``color`` argument of
  |vbar| to achieve the same result:

  .. bokeh-plot:: __REPO__/examples/basic/bars/colormapped.py
    :source-position: above

  See :ref:`ug_basic_data_color_mapping` for more information on using
  Bokeh’s color mappers.

.. _ug_basic_bars_stacked:

Stacking
~~~~~~~~

To stack vertical bars, use the :func:`~bokeh.plotting.figure.vbar_stack`
function. The example below uses three sets of fruit data. Each set
corresponds to a year. This example produces a bar chart for each set and
stacks each fruit's bar elements on top of each other.

.. bokeh-plot:: __REPO__/examples/basic/bars/stacked.py
    :source-position: above

You can also stack bars that represent positive and negative values:

.. bokeh-plot:: __REPO__/examples/basic/bars/stacked_split.py
    :source-position: above

Tooltips
''''''''

Bokeh automatically sets the ``name`` property of each layer to
its name in the data set. You can use the ``$name`` variable to
display the names on tooltips. You can also use the ``@$name``
tooltip variable to retrieve values for each item in a layer from
the data set.

The example below demonstrates both behaviors:

.. bokeh-plot:: __REPO__/examples/basic/bars/stacked_hover.py
    :source-position: above

You can override the value of ``name`` by passing it manually to
the ``vbar_stack`` or ``hbar_stack`` function. In this case,
``$@name`` will correspond to the names you provide.

The ``hbar_stack`` and ``vbar_stack`` functions return a list of
all the renderers (one per bar stack). You can use this list to
customize the tooltips for each layer.

.. code-block:: python

    renderers = p.vbar_stack(years, x='fruits', width=0.9, color=colors, source=source,
                             legend=[value(x) for x in years], name=years)

    for r in renderers:
        year = r.name
        hover = HoverTool(tooltips=[
            ("%s total" % year, "@%s" % year),
            ("index", "$index")
        ], renderers=[r])
        p.add_tools(hover)

.. _ug_basic_bars_grouped:

Grouping
~~~~~~~~

Instead of stacking, you also have the option to group the bars. Depending on
your use case, you can achieve this in two ways:

* :ref:`With nested categories <ug_basic_bars_grouped_nested>`
* :ref:`With visual offsets <ug_basic_bars_grouped_dodged>`

.. _ug_basic_bars_grouped_nested:

Nested categories
'''''''''''''''''

If you provide several subsets of data, Bokeh automatically groups the bars into
labeled categories, tags each bar with the name of the subset it
represents, and adds a separator between the categories.

The example below creates a sequence of fruit-year pairs (tuples) and
groups the bars by fruit name with a single call to |vbar|.

.. bokeh-plot:: __REPO__/examples/basic/bars/nested.py
    :source-position: above

To apply different colors to the bars, use |factor_cmap| for
``fill_color`` in the |vbar| function call as follows:

.. code-block:: python

    p.vbar(x='x', top='counts', width=0.9, source=source, line_color="white",

           # use the palette to colormap based on the x[1:2] values
           fill_color=factor_cmap('x', palette=palette, factors=years, start=1, end=2))


The ``start=1`` and ``end=2`` in the call to |factor_cmap| use the
year in the ``(fruit, year)`` pair for color mapping.

.. bokeh-plot:: __REPO__/examples/basic/bars/nested_colormapped.py
    :source-position: none

.. _ug_basic_bars_grouped_dodged:

Visual offset
'''''''''''''

Take a scenario with separate sequences of ``(fruit, year)`` pairs
instead of a single data table. You can plot the sequences with
separate calls to |vbar|. However, since every bar in each group
belongs to the same ``fruit`` category, the bars will overlap. To
avoid this behavior, use the :func:`~bokeh.transform.dodge` function
to provide an offset for each call to |vbar|.

.. bokeh-plot:: __REPO__/examples/basic/bars/dodged.py
    :source-position: above

.. _ug_basic_bars_stacked_and_grouped:

Stacking and grouping
~~~~~~~~~~~~~~~~~~~~~

You can also combine the above techniques to create plots of stacked and
grouped bars. Here is an example that groups bars by quarter and stacks
them by region:

.. bokeh-plot:: __REPO__/examples/basic/bars/stacked_grouped.py
    :source-position: above

.. _ug_basic_bars_mixed:

Mixed factors
~~~~~~~~~~~~~

You can use any level in a multi-level data structure to position glyphs.

The example below groups bars for each month into financial quarters and
adds a quarterly average line at the group center coordinates from ``Q1``
to ``Q4``.

.. bokeh-plot:: __REPO__/examples/basic/bars/mixed.py
    :source-position: above

.. _ug_basic_bars_pandas:

Using pandas
~~~~~~~~~~~~

`pandas`_ is a powerful and popular tool for analyzing tabular and time series
data in Python. While not necessary, it can make working with Bokeh easier.

For example, you can use the ``GroupBy`` objects offered by pandas to
initialize a ``ColumnDataSource`` and automatically create columns for many
statistical parameters, such as group mean and count. You can also pass these
``GroupBy`` objects as a ``range`` argument to ``figure``.

.. bokeh-plot:: __REPO__/examples/basic/bars/pandas_groupby_colormapped.py
    :source-position: above

The example above groups data by the column ``'cyl'``, which is why the
``ColumnDataSource`` includes this column. It also adds associated columns
to non-grouped categories such as ``'mpg'``, providing, for instance, a mean
number of miles per gallon in the ``'mpg_mean'`` column.

This also works with multi-level groups. The example below groups the same
data by ``('cyl', 'mfr')`` and displays it in nested categories distributed
along the x-axis. Here, the index column name ``'cyl_mfr'`` is made by
joining the names of the grouped columns.

.. bokeh-plot:: __REPO__/examples/basic/bars/pandas_groupby_nested.py
    :source-position: above

.. _ug_basic_bars_intervals:

Intervals
---------

You can use bars for more than just bar charts with a common baseline. In case
each category has both a starting and ending value associated, you can also
use bars to represent intervals across a range for each category.

The example below supplies the |hbar| function with both ``left`` and
``right`` properties to show the spread in times between gold and bronze
medalists in Olympic sprinting over many years.

.. bokeh-plot:: __REPO__/examples/basic/bars/intervals.py
    :source-position: above

.. |hbar|               replace:: :py:func:`~bokeh.plotting.Figure.hbar`
.. |vbar|               replace:: :py:func:`~bokeh.plotting.Figure.vbar`

.. _pandas: http://pandas.pydata.org
