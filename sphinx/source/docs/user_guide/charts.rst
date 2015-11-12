.. _userguide_charts:

Using High-level Charts
=======================

.. contents::
    :local:
    :depth: 2

The high level ``bokeh.charts`` interface provides a fast, convenient way
to create common statistical charts with a minimum of code. Wherever possible,
the interface is geared to be extremely simple to use in conjunction with
Pandas, by accepting a ``DataFrame`` and names of columns directly to specify
data.

.. warning::
    This guide describes a new charts API introduced in release `0.10`.
    Some older chart types have not yet been converted. However this new
    API is such an important and dramatic improvement that it was decided
    not to wait any longer to release it. All of the older charts are still
    available in a ``bokeh._legacy_charts`` modules that will be removed
    later, once all chart types are converted to the new API.

Key Concepts
------------

* **Data**: Input data is either a Pandas :class:`pandas.DataFrame` or other table-like
    structure, yet also handling simple formats through conversion to a `DataFrame`
    internally.
* **Smart Defaults**: The attempt is made to provide unique chart attribute assignment
  (color, marker, etc) by one or more column names, while supporting custom and/or
  advanced configuration through the same keyword argument.

.. _userguide_charts_data_types:

Accepted Charts Data Formats
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Charts make use of Pandas :class:`~pandas.DataFrame` internally, so any inputs provided
coerced into this format. The Charts interface provides support for the more simple
types externally, which can be useful for quickly building charts, or can avoid having
to remember how to import and create a dataframe.

The input types accepted are:

- **Array-like**: 1..* list, tuple, :class:`numpy.ndarray`, :class:`pandas.Series`
- **Table-like**:
    - records: a list(dict)
    - columns: a dict(list), :class:`pandas.DataFrame`, or blaze resource

.. _userguide_attribute_specification:

Attribute Specification
~~~~~~~~~~~~~~~~~~~~~~~

An ``AttrSpec`` is a model for generating a look-up from a unique data label (ex. ('a',
3)), into a chained iterable. This functionality is what powers one-liner chart
generation, while also providing flexibility for customized inputs.

If you were to manually generate the glyphs in a plot, you might start by using Pandas
:meth:`~pandas.DataFrame.groupby` to identify unique subsets of your data that you'd
like to differentiate. You would iterate over each data label and data group and assign
unique attributes to the group.

**Simple Use Case**
However, what if we don't want one specific attribute type per group? Instead, let's
say we grouped by `['a', 'b']`, where `a` has 3 unique values and `b` has 10 unique
values. We want to change the color by `a` and change the marker by `b`. In the groupby
iteration, you will see each value of `a` multiple times, meaning you'll need some way
of keeping track of which unique value of which column will result in the assignment of
each attribute value.

**Supporting Exploratory Use**
More importantly, you'll need to pre-define enough unique values of the attribute to
assign to each value you have grouped on, which isn't necessarily complicated, but it
can be especially time consuming for new or sporatic users. This process of assigning
attributes is also generally of little interest to users that prioritize interactive data
discovery over novel charts. With the discovery use case, you are trying to understand
what relationships exist within the data, so it is counter-productive to require the user
to understand the data before plotting it.

Attribute Specifications avoid this issue, but are also designed to provide
the ability to configure specific behavior as well. The typical pattern of use is shown
shown below in pseudocode:

.. code-block:: python

    from bokeh.charts import color, marker

    # generally any chart attribute can be handled with attribute specifications

    Chart(df, color='red')          # single constant value supported
    Chart(df, color='a')            # typical use is with column name input
    Chart(df, color=['a', 'b'])     # or multiple column names
    Chart(df, color=color(['a', 'b']))     # equivalent to previous line

    # input of custom iterables that are automatically chained
    Chart(df, color=color('a', palette=['red', 'green', 'blue']))
    Chart(df, color=color('a', palette=['red', 'green', 'blue']),
          marker=marker('b', markers=['circle', 'x']))

.. _userguide_charts_bar:

Bar Charts
----------

The ``Bar`` high-level chart can produce bar charts in various styles.
``Bar`` charts are configured with a DataFrame data object, and a column
to group. This column will label the x-axis range. Each group is
aggregated over the ``values`` column and bars are show for the totals:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_bar.py
    :source-position: above


.. _userguide_charts_bar_agg:

Aggregations
~~~~~~~~~~~~

The ``agg`` parameter may be used to specify how each group should be
aggregated:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_bar_agg.py
    :source-position: above

Available aggregations are:

* ``'sum'``
* ``'mean'``
* ``'count'``
* ``'nunique'``
* ``'median'``
* ``'min'``
* ``'max'``

.. _userguide_charts_bar_width:

Bar Width
~~~~~~~~~

The ``bar_width`` parameter can be used to specify the width of the bars, as
percentage of category width:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_bar_width.py
    :source-position: above

.. _userguide_charts_bar_color:

Bar Color
~~~~~~~~~

The ``color`` parameter can be used to specify the color of the bars:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_bar_color.py
    :source-position: above


.. _userguide_charts_bar_group:

Grouping
~~~~~~~~

Groups in the data may be visually grouped using the ``group`` parameter:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_bar_group.py
    :source-position: above


.. _userguide_charts_bar_stack:

Stacking
~~~~~~~~

Groups in the data may be visually stacked using the ``stack`` parameter:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_bar_stack.py
    :source-position: above


.. _userguide_charts_boxplot:

Box Plots
---------

The ``BoxPlot`` can be used to summarize the statistical properties
of different groups of data. The ``label`` specifies a column in the data
to group by, and a box plot is generated for each group:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_boxplot.py
    :source-position: above

The label can also accept a list of column names, in which case the data
is grouped by all the groups in the list:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_boxplot_nested_label.py
    :source-position: above


.. _userguide_charts_boxplot_color:

Box Color
~~~~~~~~~

The color of the box in a ``BoxPlot`` can be set to a fixed color using the
``color`` parameter:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_boxplot_box_color.py
    :source-position: above

As with ``Bar`` charts, the color can also be given a column name, in which
case the boxes are shaded automatically according to the group:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_boxplot_box_color_groups.py
    :source-position: above


.. _userguide_charts_boxplot_whisker_color:

Whisker Color
~~~~~~~~~~~~~

The color of the whiskers can be similary controlled using the ``whisker_color``
paramter. For a single color:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_boxplot_whisker_color.py
    :source-position: above

Or shaded automatically according to a column grouping:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_boxplot_whisker_color_groups.py
    :source-position: above


.. _userguide_charts_boxplot_outliers:

Outliers
~~~~~~~~

By default, ``BoxPlot`` charts show outliers above and below the whiskers.
However, the display of outliers can be turned on or off with the ``outliers``
parameter:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_boxplot_outliers.py
    :source-position: above


.. _userguide_charts_boxplot_markers:

Markers
~~~~~~~

The marker used for displaying outliers is controlled by the ``marker``
parameter:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_boxplot_marker.py
    :source-position: above


.. _userguide_charts_histogram:

Histograms
----------

The ``Histogram`` high-level chart can be used to quickly display the
distribution of values in a set of data. It can be used by simply
passing it a literal sequence of values (e.g a python list, NumPy
or Pandas DataFrame column):

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_values_literal.py
    :source-position: above

It can also be used by passing in a Pandas Dataframe as the first
argument, and specifying the name of the column to use for the data.
The column name can be provided as the second positional argument:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_values_field_arg.py
    :source-position: above

Or explicitly as the ``values`` keyword argument:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_values_field_kwarg.py
    :source-position: above


.. _userguide_charts_histogram_bins:

Number of Bins
~~~~~~~~~~~~~~

The ``bins`` argument can be used to specify the number of bins to use when
computing the histogram:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_bins.py
    :source-position: above


.. _userguide_charts_histogram_bar_color:

Bar Color
~~~~~~~~~

It is also possible to control the color of the histogram bins by setting
the ``color`` parameter:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_color.py
    :source-position: above


.. _userguide_charts_histogram_color_groups:

Color Groups
~~~~~~~~~~~~

However, the ``color`` parameter can also be used to group the data. If the
value of the ``color`` parameter is one of the DataFrame column names, the data
is first grouped by this column, and a histogram is generated for each group.
Each histogram is automatically colored differently, and a legend displayed:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_color_groups.py
    :source-position: above



.. _userguide_charts_scatter:

Scatter Plots
-------------

The ``Scatter`` high-level chart can be used to generate 1D or (more commonly)
2D scatter plots. It is used by passing in DataFrame-like object as the first
argument then specifying the columns to use for ``x`` and ``y`` coordinates:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_scatter.py
    :source-position: above


.. _userguide_charts_scatter_color:

Color
~~~~~

The ``color`` parameter can be used to control the color of the scatter
markers:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_scatter_color.py
    :source-position: above


.. _userguide_charts_scatter_color_groups:

Color Groups
~~~~~~~~~~~~

if ``color`` is supplied with the name of a data column then the data is first
grouped by the values of that column, and then a different color is used for
every group:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_scatter_color_group.py
    :source-position: above


.. _userguide_charts_scatter_legend:

Legends
~~~~~~~

When grouping, a legend is usually useful, and it's location can be specified
by the ``legend`` parameter:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_scatter_legend.py
    :source-position: above

.. _userguide_charts_scatter_marker:

Markers
~~~~~~~

The ``marker`` parameter can be used to control the shape of the scatter marker:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_scatter_marker.py
    :source-position: above

As with ``color``, the ``marker`` parameter can be given a column name to group
by the values of that column, using a different marker shape for each group:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_scatter_marker_group.py
    :source-position: above

Often it is most useful to group both the color and marker shape together:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_scatter_color_marker.py
    :source-position: above


.. _userguide_charts_defaults:

Chart Defaults
--------------

The ``bokeh.charts`` modules contains a ``defaults`` attribute. Setting
attributes on this object is an easy way to control default properties
on all charts created, in one place. For instance:

.. code-block:: python

    from bokeh.charts import defaults

    defaults.width = 450
    defaults.height = 350

will set the default width and height for any chart. The full list of
attributes that can be set is below:

.. bokeh-model:: bokeh.charts.chart_options.ChartOptions


