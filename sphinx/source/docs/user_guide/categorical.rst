.. _userguide_categorical:

Handling Categorical Data
=========================

.. note::
    Several examples in this chapter use `Pandas`_, for ease of presentation
    and because it is a common tool for data manipulation. However, ``Pandas``
    is not required to create anything shown here.

.. _userguide_categorical_bars:

Bars
----

.. _userguide_categorical_bars_basic:

Basic
~~~~~

Bokeh makes it simple to create basic bar charts using the
:func:`~bokeh.plotting.Figure.hbar` and
:func:`~bokeh.plotting.Figure.vbar` glyphs methods. In the example
below, we have the following sequence of simple 1-level factors:

.. code-block:: python

    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

To inform Bokeh that the x-axis is categorical, we pass this list of factors
as the ``x_range`` argument to :func:`~bokeh.plotting.figure`:

.. code-block:: python

    p = figure(x_range=fruits, ... )

Note that passing the list of factors is a convenient shorthand notation for
creating a :class:`~bokeh.models.ranges.FactorRange`. The equivalent explicit
notation is:

.. code-block:: python

    p = figure(x_range=FactorRange(factors=fruits), ... )

This more explicit form is useful when you want to customize the
``FactorRange``, e.g. by changing the range or category padding.

Next, we can call ``vbar`` with the list of fruit name factors as the ``x``
coordinate, the bar height as the ``top`` coordinate, and optionally any
``width`` or other properties that we would like to set:

.. code-block:: python

    p.vbar(x=fruits, top=[5, 3, 4, 2, 4, 6], width=0.9)

All put together, we see the output:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_basic.py
    :source-position: above

As usual, the data could also be put into a ``ColumnDataSource`` supplied as
the ``source`` parameter to ``vbar`` instead of passing the data directly
as parameters. Later examples will demonstrate this.

.. _userguide_categorical_bars_sorted:

Sorted
~~~~~~

Since Bokeh displays bars in the order the factors are given for the range,
"sorting" bars in a bar plot is identical to sorting the factors for the range.

In the example below the fruit factors are sorted in increasing order according
to their corresponding counts, causing the bars to be sorted:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_sorted.py
    :source-position: above

.. _userguide_categorical_bars_filled:

Filled
~~~~~~~

.. _userguide_categorical_bars_filled_colors:

Colors
''''''

Oftentimes we may want to have bars that are shaded some color. This can be
accomplished in different ways. One way is to supply all the colors up front.
This can be done by putting all the data, including the colors for each bar,
in a ``ColumnDataSource``. Then the name of the column containing the colors
is passed to ``vbar`` as the ``color`` (or ``line_color``/``fill_color``)
arguments. This is shown below:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_colors.py
    :source-position: above

Another way to shade the bars is to use a ``CategoricalColorMapper`` that
colormaps the bars inside the browser. There is a function
:func:`~bokeh.transform.factor_cmap` that makes this simple to do:

.. code-block:: python

    factor_cmap('fruits', palette=Spectral6, factors=fruits)

This can be passed to ``vbar`` in the same way as the column name in the
previous example. Putting everything together, we obtain the same plot in
a different way:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_colormapped.py
    :source-position: above

.. _userguide_categorical_bars_stacked:

Stacked
~~~~~~~

Another common operation on bar charts is to stack bars on top of one
another. Bokeh makes this easy to do with the specialized
:func:`~bokeh.plotting.Figure.hbar_stack` and
:func:`~bokeh.plotting.Figure.vbar_stack` functions. The example
below shows the fruits data from above, but with the bars for each
fruit type stacked instead of grouped:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked.py
    :source-position: above

Note that behind the scenes, these functions work by stacking up the
successive columns in separate calls to ``vbar`` or ``hbar``. This kind of
operation is akin to the dodge example above (i.e. the data in this case is
*not* in a "tidy" data format).

Sometimes we may want to stack bars that have both positive and negative
extents. The example below shows how it is possible to create such a
stacked bar chart that is split by positive and negative values:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked_split.py
    :source-position: above

Hover Tools
'''''''''''

For stacked bar plots, Bokeh provides some special hover variables that are
useful for common cases.

When stacking bars, Bokeh automatically sets the ``name`` property for each
layer in the stack to be the value of the stack column for that layer. This
name value is accessible to hover tools via the ``$name`` special variable.

Additionally, the hover variable ``@$name`` can be used to look up values from
the stack column for each layer. For instance, if a user hovers over a stack
glyph with the name ``"US East"``, then ``@$name`` is equivalent to
``@{US East}``.

The example below demonstrates both of these hover variables:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked_hover.py
    :source-position: above

Note that it is also possible to override the value of ``name`` by passing it
manually to ``vbar_stack`` and ``hbar_stack``. In this case, ``$@name`` will
look up the column names provided by the user.

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
