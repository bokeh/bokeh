.. _userguide_charts:

Using High-level Charts
=======================

.. contents::
    :local:
    :depth: 2


.. _userguide_charts_histogram:

Histograms
----------

The `Histogram` high-level chart can be used to quickly display the
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

Or explicitly as the `values` keyword argument:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_values_field_kwarg.py
    :source-position: above

.. _userguide_charts_histogram_bins:

Number of Bins
~~~~~~~~~~~~~~

The `bins` argument can be used to specify the number of bins to use when
computing the histogram:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_bins.py
    :source-position: above

.. _userguide_charts_histogram_bar_color:


Bar Color
~~~~~~~~~

It is also possible to control the color of the histogram bins by setting
the `color` parameter:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_color.py
    :source-position: above


.. _userguide_charts_histogram_color_groups:

Color Groups
~~~~~~~~~~~~

However, the `color` parameter can also be used to group the data. If the
value of the `color` parameter is one of the DataFrame column names, the data
is first grouped by this column, and a histogram is generated for each group.
Each histogram is automatically colored differently, and a legend displayed:

.. bokeh-plot:: source/docs/user_guide/source_examples/charts_histogram_color_groups.py
    :source-position: above



.. _userguide_charts_defaults:

Chart Defaults
--------------
