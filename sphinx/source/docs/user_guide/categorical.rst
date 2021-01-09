.. _userguide_categorical:

Handling categorical data
=========================

.. note::
    To help with presentation, several examples in this chapter
    use `pandas`_, a common tool for data manipulation. However,
    you don't need ``pandas`` to create anything shown here.

.. _userguide_categorical_bars:

Bars
----

.. _userguide_categorical_bars_basic:

Basic
~~~~~

To create a basic bar chart, simply use the
:func:`~bokeh.plotting.Figure.hbar` or
:func:`~bokeh.plotting.Figure.vbar` glyph methods. The
example below shows a sequence of simple 1-level categories.

.. code-block:: python

    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

To assign these categories to the x-axis, pass this list as the
``x_range`` argument to :func:`~bokeh.plotting.Figure`.

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

Next, call ``vbar`` with the list of fruit names as
the ``x`` coordinate and the bar height as the ``top``
coordinate. You can also specify ``width`` or other
optional properties.

.. code-block:: python

    p.vbar(x=fruits, top=[5, 3, 4, 2, 4, 6], width=0.9)

Combining the above produces the following output:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_basic.py
    :source-position: above

You can also assign the data to a ``ColumnDataSource``
and supply it as the ``source`` parameter to ``vbar``
instead of passing the data directly as parameters.
You will see this in later examples.

.. _userguide_categorical_bars_sorted:

Sorting
~~~~~~~

To order the bars of a given plot, simply sort the categories by
value.

The example below sorts the fruit categories in ascending order
based on counts and rearranges the bars accordingly.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_sorted.py
    :source-position: above

.. _userguide_categorical_bars_filled:

Filling
~~~~~~~

.. _userguide_categorical_bars_filled_colors:

Colors
''''''

You can color the bars in several ways:

* Supply all the colors along with the rest of the data to
  a ``ColumnDataSource`` and assign the name of the color column
  to the ``color`` argument of ``vbar``.

  .. bokeh-plot:: docs/user_guide/examples/categorical_bar_colors.py
    :source-position: above

  You can also use the color column with the ``line_color`` and
  ``fill_color`` arguments to change outline and fill colors
  respectively.

* Use the ``CategoricalColorMapper`` model to map bar colors in a browser.
  You can do this with the :func:`~bokeh.transform.factor_cmap` function.

  .. code-block:: python

      factor_cmap('fruits', palette=Spectral6, factors=fruits)

  You can then pass this to the ``color`` argument of ``vbar`` to achieve
  the same result.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_colormapped.py
    :source-position: above

.. _userguide_categorical_bars_stacked:

Stacking
~~~~~~~~

To stack vertical bars, use the :func:`~bokeh.plotting.Figure.vbar_stack`
function. The example below uses three sets of fruit data, each
corresponding to a year. It produces a bar chart for each set and
overlaps them over one another.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked.py
    :source-position: above

You can also stack bars that represent positive and negative values.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked_split.py
    :source-position: above

Tooltips
''''''''

Bokeh automatically sets the ``name`` property of each layer to
its name in the data set. You can use the ``$name`` variable to
display the names on tooltips. You can also use the ``@$name``
tooltip variable to retrieve values for each item in a layer from
the data set.

The example below demonstrates both behaviors:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked_hover.py
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

.. _userguide_categorical_bars_grouped:

Grouping
~~~~~~~~

Instead of stacking, you may wish to group the bars. Depending on your
use case, you can achieve this in two ways:

* With nested categories
* With visual offsets

.. _userguide_categorical_bars_grouped_nested:

Nested categories
'''''''''''''''''

With several subsets of data, Bokeh automatically groups the bars into
labeled categories, tags each bar with the name of the subset it
represents, and adds a separator between the categories.

The example below creates a sequence of fruit-year pairs (tuples) and
groups the bars by fruit name with a single call to ``vbar``.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_nested.py
    :source-position: above

To apply different colors to the bars, use ``factor_cmap`` for
``fill_color`` in the ``vbar`` function call as follows:

.. code-block:: python

    p.vbar(x='x', top='counts', width=0.9, source=source, line_color="white",

           # use the palette to colormap based on the the x[1:2] values
           fill_color=factor_cmap('x', palette=palette, factors=years, start=1, end=2))


The ``start=1`` and ``end=2`` in the call to ``factor_cmap`` use the
year in the ``(fruit, year)`` pair for color mapping.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_nested_colormapped.py
    :source-position: none

.. _userguide_categorical_bars_grouped_dodged:

Visual offset
'''''''''''''

Take a scenario with separate sequences of ``(fruit, year)`` pairs
instead of a single data table. You can plot the sequences with
separate calls to ``vbar``. However, since every bar in each group
belongs to the same ``fruit`` category, the bars will overlap. To
avoid this behavior, use the :func:`~bokeh.transform.dodge` function
to provide an offset for each call to ``vbar``.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_dodged.py
    :source-position: above

.. _userguide_categorical_bars_stacked_and_grouped:

Stacking and grouping
~~~~~~~~~~~~~~~~~~~~~

You can also combine the above techniques to create plots of stacked and
grouped bars. Here is an example that groups bars by quarter and stacks
them by region:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked_grouped.py
    :source-position: above

.. _userguide_categorical_bars_mixed:

Mixed factors
~~~~~~~~~~~~~

You can use any level in a multi-level data structure to position glyphs.

The example below groups bars for each month into financial quarters and
adds a quarterly average line at the group center coordinates from ``Q1``
to ``Q4``.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_mixed.py
    :source-position: above

.. _userguide_categorical_bars_pandas:

Using pandas
~~~~~~~~~~~~

`pandas`_ is a powerful and popular tool for analyzing tabular and time
series data in Python. While you don't have to use it, it makes working
with Bokeh easier.

For example, you can use the ``GroupBy`` objects offered by pandas to
initialize a ``ColumnDataSource`` and automatically create columns for
many statistical parameters, such as group mean and count. You can also
pass these ``GroupBy`` objects as a ``range`` argument to ``figure``.

Here's how you can leverage `pandas`_ to your advantage:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_pandas_groupby_colormapped.py
    :source-position: above

The example above groups data by the column ``'cyl'``, which is why the
``ColumnDataSource`` includes this column. It also adds associated columns
to non-grouped categories such as ``'mpg'`` providing, for instance, a mean
number of miles per gallon in the ``'mpg_mean'`` column.

This also works with multi-level groups. The example below groups the same
data by ``('cyl', 'mfr')`` and displays it in nested categories distributed
along the x-axis. Here, the index column name ``'cyl_mfr'`` is made by
joining the names of the grouped columns.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_pandas_groupby_nested.py
    :source-position: above

.. _userguide_categorical_bars_intervals:

Intervals
---------

Bars can be used for more than just bar charts with a common baseline.
You can also use them to represent intervals across a range.

The example below supplies the ``hbar`` function with both ``left`` and
``right`` properties to show the spread in times between gold and bronze
medalists in Olympic sprinting over many years.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_intervals.py
    :source-position: above

.. _userguide_categorical_scatters:

Scatters
--------

.. .. bokeh-plot:: docs/user_guide/examples/categorical_scatter.py
..     :source-position: above

.. _userguide_categorical_scatters_jitter:

Adding jitter
~~~~~~~~~~~~~

To avoid overlap between numerous scatter points in a single category, use
the :func:`~bokeh.transform.jitter` function to give each point a random
offset.

The example below shows a scatter plot of every commit time for a GitHub
user between 2012 and 2016. It groups commits by day of the week. By
default, this plot would show thousands of points overlapping in a narrow
line for each day. The ``jitter`` function lets you differentiate the
points to produce a useful plot:

.. bokeh-plot:: docs/user_guide/examples/categorical_scatter_jitter.py
    :source-position: above

.. _userguide_categorical_offsets:

Categorical offsets
-------------------

Outside of the ``dodge`` and ``jitter`` functions, you can also supply an
offset to a categorical location explicitly. To do so, add a numeric value
to the end of a category. For example, ``["Jan", 0.2]`` gives the category
"Jan" an offset of 0.2.

For multi-level categories, add the value at the end of the existing list:
``["West", "Sales", -0,2]``. Bokeh interprets any numeric value at the end
of a list of categories as an offset.

Take the fruit example above and modify it as follows:

.. code-block:: python

    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

    offsets = [-0.5, -0.2, 0.0, 0.3, 0.1, 0.3]

    # This results in [ ['Apples', -0.5], ['Pears', -0.2], ... ]
    x = list(zip(fruits, offsets))

    p.vbar(x=x, top=[5, 3, 4, 2, 4, 6], width=0.8)

This will shift each bar horizontally by the corresponding offset.

.. bokeh-plot:: docs/user_guide/examples/categorical_offset.py
    :source-position: none

Below is a more sophisticated example of a ridge plot. It uses
categorical offsets to specify patch coordinates for each
category.

.. bokeh-plot:: docs/user_guide/examples/categorical_ridgeplot.py
    :source-position: below

.. _userguide_categorical_heatmaps:

Heatmaps
--------

If you apply different shades to rectangles that represent a pair
of categories, you get a *categorical heatmap*. This is a plot
with two categorical axes.

The following plot lists years from 1948 to 2016 on its x-axis
and months of the year on the y-axis. Each rectangle of the plot
corresponds to a ``(year, month)`` pair. The color of the rectangle
indicates the rate of unemployment in a given month of a given
year.

This example uses the ``LinearColorMapper`` to map the colors of
the plot because the unemployment rate is a continuous variable.
This mapper is also passed to the color bar to provide a visual
legend on the right:

.. bokeh-plot:: docs/user_guide/examples/categorical_heatmap_unemployment.py
    :source-position: below

The following periodic table is a good example of the techniques
in this chapter:

* Color mappers
* Visual offsets
* pandas DataFrames
* Tooltips

.. bokeh-plot:: docs/user_guide/examples/categorical_heatmap_periodic.py
    :source-position: below

.. _pandas: http://pandas.pydata.org
