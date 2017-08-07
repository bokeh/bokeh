.. _userguide_categorical:

Handling Categorical Data
=========================

.. _userguide_categorical_data:

Data Representation
-------------------

.. _userguide_categorical_data_pandas:

Pandas Integrations
~~~~~~~~~~~~~~~~~~~

.. note::
    Several examples in this chapter use `Pandas`_, for ease of presentation
    and because it is a common tool for data manipulation. However, ``Pandas``
    is not required to create anything shown here.

.. _userguide_categorical_data_padding:

Range Padding
~~~~~~~~~~~~~

.. _userguide_categorical_bars:

Bars
----

.. _userguide_categorical_bars_basic:

Basic
~~~~~

Bokeh make it simple to create basic bar charts using the
:func:`~bokeh.plotting.figure.Figure.hbar` and
:func:`~bokeh.plotting.figure.Figure.vbar` glyphs methods. In the example
below, we have the following sequence of simple 1-level factors:

.. code-block:: python

    fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']

To inform Bokeh that the x-axis is categorical, we pass this list of factors
as the ``x_range`` argument to :fund:``~bokeh.plotting.figure.figure``:

.. code-block:: python

    p = figure(x_range=fruits, ... )

Note that passing the list of factors is a convenient shorthand notation for
creating a :class:`~bokeh.models.ranges.FactorRange`. The equivalent explicit
notation is:

.. code-block:: python

    p = figure(x_range=FactorRange(field=fruits), ... )

This more explicit for is useful when you want to customize the
``FactorRange``, e.g. by changing the
:ref:`userguide_categorical_data_padding`.

Next we can call ``vbar`` with the list of fruit name factors as the ``x``
coordinate, the bar height as the ``top`` coordinate, and optionally any
``width`` or other properties that we would like to set:

.. code-block:: python

    p.vbar(x=fruits, top=[5, 3, 4, 2, 4, 6], width=0.9)

All put together, we see the output:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_basic.py
    :source-position: above

As usual, the data could also be put into a ``ColumnDataSource`` supplied as
the ``source`` parameter to ``vbar`` instead of passing the data directly
as parameters. The next example will demonstrate this.

.. _userguide_categorical_bars_colormapped:

Colors
~~~~~~

Often times we may want to have bars that are shaded some color. This can be
accomplished in different ways. One way is to supply all the colors up front.
This can be done by putting all the data, including the colors for each bar,
in a ``ColumnDataSource``. Then the name of the column containing the colors
is passed to ``figure`` as the ``color`` (or ``line_color``/``fill_color``)
arguments. This is shown below:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_colors.py
    :source-position: above

Another way to shade the bars is to use a ``CategoricalColorMapper`` that
colormaps the bars inside the browser. There is a function
:func:`~bokeh.transform.factor_cmap` that makes this simple to do:

.. code-block:: python

    factor_cmap('fruits', palette=Spectral6, factors=fruits))

This can be passed to ``figure`` in the same way as the column name in the
previous example. Putting everything together we obtain the same plot in
a different way:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_colormapped.py
    :source-position: above


.. _userguide_categorical_bars_grouped:

Grouped
~~~~~~~

When creating bar charts, it is often desirable to visually display the
data according to sub-groups. There are two basic methods that can be used,
depending on your use case: using nested categorical coordinates, or
applying vidual dodges.

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
same grouped bar plot of fruits data as above, except with the bars shaded by
the year, changethe ``vbar`` function call to use ``factor_cmap`` for the
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

In this scenario, our data is not "tidy". Instead a single table with
rows indexed by factors ``(fruit, year)``, we have separate series for each
year. We can plot all the year series using separate calls to ``vbar`` but
since every bar in each group has the same ``fruit`` factor, the bars would
overlap visually. We can prevent this overlap and distinguish the bars
visually by using the :func:`~bokeh.transform.dodge` function to provide an
offset for each different call to ``vbar``:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_dodged.py
    :source-position: above

.. _userguide_categorical_bars_stacked:

Stacked
~~~~~~~

Another common operation or bar charts is to stack bars on top of one
another. Bokeh makes this easy to do with the specialized
:func:`~bokeh.plotting.figure.Figure.hbar_stack` and
:func:`~bokeh.plotting.figure.Figure.vbar_stack` functions. The example
below shows the fruits data from above, but with the bars for each
fruit type stacked instead of grouped:

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_stacked.py
    :source-position: above

Note that behing the scenes, these functions work by stacking up the
successive columns in separate calls to ``vbar`` or ``hbar``. This kind of
operation is akin the to dodge example above (i.e. the data in this case is
*not* in a "tidy" data format).

.. _userguide_categorical_bars_pandas:

Pandas
~~~~~~

`Pandas`_ is a powerful and common tool for doing data analysis on tabular and
timeseries data in Python. Although it is not *required* by Bokeh, Bokeh tries
to make life easier when you do.

Below is a plot that demonstrates some advantages when using Pandas with
Bokeh:

* Pandas ``GroupBy`` objects can be used to initialize a ``CoumnDataSource``,
  automatically creating columns for many statistical measures such as the
  group mean or count

* ``GroupBy`` objects may also be passed directly as a range argument to
  ``figure``.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_pandas_groupby_colormapped.py
    :source-position: above

Not that in the example above, we grouped by the column ``'cyl'`` so our CDS
has a column ``'cyl'`` for this index. Additionally, other non-grouped columns
like ``'mpg'`` have had associated columns such ``'mpg_mean'`` added, that
give the mean MPG value for each group.

This usage also works when the grouping is multi-level. The example below shows
how grouping the same data by ``('cyl', 'mfr')`` results in a hierarchical
nested axis. In this case, the index column name ``'cyl_mfr'`` is made by
joining the names of the grouped columns together.

.. bokeh-plot:: docs/user_guide/examples/categorical_bar_pandas_groupby_nested.py
    :source-position: above

.. _userguide_categorical_bars_intervals:

Intervals
~~~~~~~~~

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

.. _userguide_categorical_heatmaps:

Heat Maps
---------

In all of the cases above, we have had one categorical axis, and one
continuous axis. It is possible to have plots with two categorical axes. If
we shade the rectangle that defines each pair of categories, we end up with
a *Categorical Heatmap*

The plot below shows such a plot, where the x-axis categories are a list of
years from 1948 to 2016, and the y-axis categories are the months of the
years. Each rectangle corresponding to a ``(year, month)`` combination is
color mapped by the unemployment rate for that month and year. Since the
unemployment rate is a continuous variable, a ``LinearColorMapper`` is used
to colormap the plot, and is also passed to a color bar to provide a visual
legend on the right:

.. bokeh-plot:: docs/user_guide/examples/categorical_heatmap_unemployment.py
    :source-position: above

A final example combines many of the techniques in this chapter: color mappers,
visual dodges, and Pandas DataFrames. These are used to create a different
sort of "heatmap" that results in a periodic table of the elements. A hover
tool as also been added so that additional information about each element
can be inspected:

.. bokeh-plot:: docs/user_guide/examples/categorical_heatmap_periodic.py
    :source-position: above


.. _Pandas: http://pandas.pydata.org
