.. _userguide_categorical:

Handling categorical data
=========================

.. note::
    Several examples in this chapter use `Pandas`_, for ease of presentation
    and because it is a common tool for data manipulation. However, you don't
    need ``Pandas`` to create anything shown here.

.. _userguide_categorical_bars:

Bars
----

.. _userguide_categorical_bars_basic:

Basic
~~~~~

Bokeh makes it simple to create basic bar charts using the
:func:`~bokeh.plotting.Figure.hbar` and
:func:`~bokeh.plotting.Figure.vbar` glyph methods. The
example below has a sequence of simple 1-level factors.

.. code-block:: python

    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

To make the x-axis categorical, pass this list of factors
as the ``x_range`` argument to :func:`~bokeh.plotting.Figure`.

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

To order the bars of a given plot, simply sort the factors.

The example below sorts the fruit factors in ascending order
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

To stack the bars, use the :func:`~bokeh.plotting.Figure.hbar_stack`
and :func:`~bokeh.plotting.Figure.vbar_stack` functions. The example
below uses three sets of fruit data, each corresponding to a year. It
produces a bar chart for each set and overlaps them over one another.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked.py
    :source-position: above

You can also stack bars that represent both positive and negative
values.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked_split.py
    :source-position: above

Tooltips
''''''''

Bokeh automatically sets the ``name`` property of each layer to
its name in the data set. You can use the ``$name`` variable to
pass this value to hover tools. You can also use the ``@$name``
hover variable to look up values for each layer in the data set.

The example below demonstrates both behaviors:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked_hover.py
    :source-position: above

You can override the value of ``name`` by passing it manually to
``vbar_stack`` or ``hbar_stack``. In this case, ``$@name`` will
correspond to the names you provide.

To have
It may also sometimes be desirable to have a different hover tool for each
layer in the stack. For such cases, the ``hbar_stack`` and ``vbar_stack``
functions return a list of all the renderers created (one for each stack).
These can be used to customize different hover tools for each layer:

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

Grouped
~~~~~~~

When creating bar charts, it is often desirable to visually display the
data according to sub-groups. There are two basic methods that can be used,
depending on your use case: using nested categorical coordinates or
applying visual dodges.

.. _userguide_categorical_bars_grouped_nested:

Nested Categories
'''''''''''''''''

If the coordinates of a plot range and data have two or three levels, then
Bokeh will automatically group the factors on the axis, including a
hierarchical tick labeling with separators between the groups. In the case
of bar charts, this results in bars grouped together by the top-level
factors. This is probably the most common way to achieve grouped bars,
especially if you are starting from "tidy" data.

The example below shows this approach by creating a single column of
coordinates that are each 2-tuples of the form ``(fruit, year)``. Accordingly,
the plot groups the axes by fruit type, with a single call to ``vbar``:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_nested.py
    :source-position: above

We can also apply a color mapping, similar to the earlier example. To obtain
the same grouped bar plot of fruits data as above, except with the bars shaded by
the year, change the ``vbar`` function call to use ``factor_cmap`` for the
``fill_color``:

.. code-block:: python

    p.vbar(x='x', top='counts', width=0.9, source=source, line_color="white",

           # use the palette to colormap based on the the x[1:2] values
           fill_color=factor_cmap('x', palette=palette, factors=years, start=1, end=2))


Recall that the factors are of the for ``(fruit, year)``. The ``start=1``
and ``end=2`` in the call to ``factor_cmap`` select the second part of data
factors to use when color mapping.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_nested_colormapped.py
    :source-position: none

.. _userguide_categorical_bars_grouped_dodged:

Visual Dodge
''''''''''''

Another method for achieving grouped bars is to explicitly specify a visual
displacement for the bars. Such a visual offset is also referred to as a
*dodge*.

In this scenario, our data is not "tidy". Instead of a single table with
rows indexed by factors ``(fruit, year)``, we have separate series for each
year. We can plot all the year series using separate calls to ``vbar``, but
since every bar in each group has the same ``fruit`` factor, the bars would
overlap visually. We can prevent this overlap and distinguish the bars
visually by using the :func:`~bokeh.transform.dodge` function to provide an
offset for each different call to ``vbar``:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_dodged.py
    :source-position: above

.. _userguide_categorical_bars_stacked_and_grouped:

Stacked and Grouped
~~~~~~~~~~~~~~~~~~~

The above techniques for stacking and grouping may also be used together to
create a stacked, grouped bar plot.

Continuing the example above with bars grouped by quarter, we might stack each
individual bar by region.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked_grouped.py
    :source-position: above

.. _userguide_categorical_bars_mixed:

Mixed Factors
~~~~~~~~~~~~~

When dealing with hierarchical categories of two or three levels, it's possible
to use just the "higher level" portion of a coordinate to position glyphs. For
example, if you have range with the hierarchical factors

.. code-block:: python

    factors = [
        ("East", "Sales"), ("East", "Marketing"), ("East", "Dev"),
        ("West", "Sales"), ("West", "Marketing"), ("West", "Dev"),
    ]

Then it is possible to use just `"Sales"` and `"Marketing"` etc. as positions
for glyphs. In this case, the position is the center of the entire group. The
example below shows bars for each month, grouped by financial quarter, and
also adds a line (perhaps for a quarterly average) at the coordinates for
``Q1``, ``Q2``, etc.:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_mixed.py
    :source-position: above

This example also demonstrates that other glyphs such as lines also function
with categorical coordinates.

.. _userguide_categorical_bars_pandas:

Pandas
~~~~~~

`Pandas`_ is a powerful and common tool for doing data analysis on tabular and
timeseries data in Python. Although it is not *required* by Bokeh, Bokeh tries
to make life easier when you do.

Below is a plot that demonstrates some advantages when using Pandas with
Bokeh:

* Pandas ``GroupBy`` objects can be used to initialize a ``ColumnDataSource``,
  automatically creating columns for many statistical measures such as the
  group mean or count

* ``GroupBy`` objects may also be passed directly as a range argument to
  ``figure``.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_pandas_groupby_colormapped.py
    :source-position: above

Note that in the example above we grouped by the column ``'cyl'``, so our CDS
has a column ``'cyl'`` for this index. Additionally, other non-grouped columns
like ``'mpg'`` have had associated columns such as ``'mpg_mean'`` added, that
give the mean MPG value for each group.

This usage also works when the grouping is multi-level. The example below shows
how grouping the same data by ``('cyl', 'mfr')`` results in a hierarchically
nested axis. In this case, the index column name ``'cyl_mfr'`` is made by
joining the names of the grouped columns together.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_pandas_groupby_nested.py
    :source-position: above

.. _userguide_categorical_bars_intervals:

Intervals
---------

So far we have seen the bar glyphs used to create bar charts, which imply
bars drawn from a common baseline. However, the bar glyphs can also be used
to represent arbitrary intervals across a range.

The example below uses ``hbar`` with both ``left`` and ``right`` properties
supplied, to show the spread in times between bronze and gold medalists in
Olympic sprinting over many years:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_intervals.py
    :source-position: above

.. _userguide_categorical_scatters:

Scatters
--------

.. .. bokeh-plot:: docs/user_guide/examples/categorical_scatter.py
..     :source-position: above

.. _userguide_categorical_scatters_jitter:

Adding Jitter
~~~~~~~~~~~~~

When plotting many scatter points in a single categorical category, it is
common for points to start to visually overlap. In this case, Bokeh provides
a :func:`~bokeh.transform.jitter` function that can automatically apply
a random dodge to every point.

The example below shows a scatter plot of every commit time for a GitHub user
between 2012 and 2016, grouped by day of the week. A naive plot of this data
would result in thousands of points overlapping in a narrow line for each day.
By using ``jitter`` we can differentiate the points to obtain a useful plot:

.. bokeh-plot:: docs/user_guide/examples/categorical_scatter_jitter.py
    :source-position: above

.. _userguide_categorical_offsets:

Categorical Offsets
-------------------

We've seen above how categorical locations can be modified by operations like
*dodge* and *jitter*. It is also possible to supply an offset to a categorical
location explicitly. This is done by adding a numeric value to the end of a
category, e.g. ``["Jan", 0.2]`` is the category "Jan" offset by a value of 0.2.
For hierarchical categories, the value is added at the end of the existing
list, e.g. ``["West", "Sales", -0,2]``. Any numeric value at the end of a
list of categories is always interpreted as an offset.

As an example, suppose we took our first example from the beginning and
modified it like this:

.. code-block:: python

    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

    offsets = [-0.5, -0.2, 0.0, 0.3, 0.1, 0.3]

    # This results in [ ['Apples', -0.5], ['Pears', -0.2], ... ]
    x = list(zip(fruits, offsets))

    p.vbar(x=x, top=[5, 3, 4, 2, 4, 6], width=0.8)

Then the resulting plot has bars that are horizontally shifted by the amount of
each corresponding offset:

.. bokeh-plot:: docs/user_guide/examples/categorical_offset.py
    :source-position: none

Below is a more sophisticated example of a Ridge Plot that displays timeseries
associated with different categories. It uses categorical offsets to specify
patch coordinates for the timeseries inside each category.

.. bokeh-plot:: docs/user_guide/examples/categorical_ridgeplot.py
    :source-position: below

.. _userguide_categorical_heatmaps:

Heatmaps
--------

In all of the cases above, we have had one categorical axis and one
continuous axis. It is possible to have plots with two categorical axes. If
we shade the rectangle that defines each pair of categories, we end up with
a *Categorical Heatmap*

The plot below shows such a plot, where the x-axis categories are a list of
years from 1948 to 2016, and the y-axis categories are the months of the
years. Each rectangle corresponding to a ``(year, month)`` combination is
colormapped by the unemployment rate for that month and year. Since the
unemployment rate is a continuous variable, a ``LinearColorMapper`` is used
to colormap the plot, and is also passed to a color bar to provide a visual
legend on the right:

.. bokeh-plot:: docs/user_guide/examples/categorical_heatmap_unemployment.py
    :source-position: below

A final example combines many of the techniques in this chapter: color mappers,
visual dodges, and Pandas DataFrames. These are used to create a different
sort of "heatmap" that results in a periodic table of the elements. A hover
tool has also been added so that additional information about each element
can be inspected:

.. bokeh-plot:: docs/user_guide/examples/categorical_heatmap_periodic.py
    :source-position: below

.. _Pandas: http://pandas.pydata.org
