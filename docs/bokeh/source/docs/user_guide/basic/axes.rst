.. _ug_basic_axes:

Ranges and axes
===============

.. _ug_basic_axes_setting_ranges:

Setting ranges
--------------

By default, Bokeh attempts to automatically set the data bounds of plots to fit
snugly around the data. You may, however, need to set a plot's range
explicitly. To do so, set the ``x_range`` and/or ``y_range`` properties using a
``Range1d`` object that lets you set the *start* and *end* points of the range
you want.

.. code-block:: python

    p.x_range = Range1d(0, 100)

For convenience, the |figure| function can also accept *(start, end)* tuples as
values for the ``x_range`` or ``y_range`` parameters. Here's how you can use
both methods to set a range:

.. bokeh-plot:: __REPO__/examples/basic/axes/figure_range.py
    :source-position: above

Ranges also have a ``bounds`` property that lets you specify the limits of the
plot beyond which the user cannot pan or zoom.

.. code-block:: python

    # set a range using a Range1d
    p.y_range = Range1d(0, 15, bounds=(0, None))

Axis types
----------

All the examples above use the default linear axis. This axis is suitable for
plots that need to show numerical data on a linear scale. However, you may have
categorical data or need to display numerical data on a datetime or log scale.
This section shows you how to specify the axis type when using the
|bokeh.plotting| interface.

Categorical axes
~~~~~~~~~~~~~~~~

To create a categorical axis, specify a
:class:`~bokeh.models.ranges.FactorRange` for one of the plot's ranges or a
list of factors to be converted to one. Here's an example:

.. bokeh-plot:: __REPO__/examples/basic/axes/categorical_axis.py
    :source-position: above

Datetime axes
~~~~~~~~~~~~~

.. note::
    The example in this section requires a network connection and depends on
    the open source Pandas library to present realistic time series data.

For time series, or any data that involves dates or time, you may want to
use axes with labels suitable for different date and time scales.

The |figure| function accepts ``x_axis_type`` and ``y_axis_type`` as arguments.
To specify a datetime axis, pass ``"datetime"`` for the value of either of
these parameters.

.. bokeh-plot:: __REPO__/examples/basic/axes/datetime_axis.py
    :source-position: above

.. note::
    Future versions of Bokeh will attempt to auto-detect situations when
    datetime axes are appropriate and add them automatically.

Log scale axes
~~~~~~~~~~~~~~

Data that grows exponentially or covers many orders of magnitude often requires
one axis to be on a log scale. For data that has a power law relationship, you
may want to use log scales on both axes.

You can use the same |figure| arguments, ``x_axis_type`` and ``y_axis_type``,
to set one or both of the axes to ``"log"``.

By default, Bokeh calculates log axis ranges to fit around positive value data.
For information on how to set your own ranges, see
:ref:`ug_basic_axes_setting_ranges`.

.. bokeh-plot:: __REPO__/examples/basic/axes/log_scale_axis.py
    :source-position: above

Mercator axes
~~~~~~~~~~~~~

Mercator axes are useful for tile sources. You can use the same |figure| arguments, ``x_axis_type`` and ``y_axis_type``,
to set one or both of the axes to ``"mercator"``.

.. bokeh-plot:: __REPO__/examples/topics/geo/tile_source.py
   :source-position: above


.. _ug_basic_axes_twin:

Twin axes
---------

You can add multiple axes representing different ranges to a single plot. To do
this, configure the plot with "extra" named ranges in the ``extra_x_range`` and
``extra_y_range`` properties. You can then refer to these named ranges when
adding new glyph methods as well as when adding new axis objects with the
``add_layout`` method of the |plot|. Here's an example:

.. bokeh-plot:: __REPO__/examples/basic/axes/twin_axes.py
    :source-position: above

.. _ug_basic_axes_fixed:

Fixed location axis
-------------------

By default Bokeh places axes on the sides of plots, but it is possible to
locate axes anywhere along a range by setting their ``fixed_location``
property:

.. bokeh-plot:: __REPO__/examples/basic/axes/fixed_axis.py
    :source-position: above
