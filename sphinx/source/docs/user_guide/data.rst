.. _userguide_data:

Providing Data
==============

No data visualization is possible without the underlying data to be represented.
In this section, the various ways of providing data for plots are explained, from
passing data values directly to creating a |ColumnDataSource| and filtering using
a |CDSView|.

Providing Data Directly
-----------------------

In Bokeh, it is possible to pass lists of values directly into plotting functions.
In the example below, the data, ``x_values`` and ``y_values``, are passed directly
to the ``circle`` plotting method (see :ref:`userguide_plotting` for more examples).

.. code-block:: python

    from bokeh.plotting import figure

    x_values = [1, 2, 3, 4, 5]
    y_values = [6, 7, 2, 3, 6]

    p = figure()
    p.circle(x=x_values, y=y_values)

When you pass in data like this, Bokeh works behind the scenes to make a
|ColumnDataSource| for you. But learning to create and use the |ColumnDataSource|
will enable you to access more advanced capabilities, such as streaming data,
sharing data between plots, and filtering data.

ColumnDataSource
----------------

The |ColumnDataSource| is the core of most Bokeh plots, providing the data
that is visualized by the glyphs of the plot. With the |ColumnDataSource|,
it is easy to share data between multiple plots and widgets, such as the
|DataTable|. When the same |ColumnDataSource| is used to drive multiple
renderers, selections of the data source are also shared. Thus, it is possible
to use a select tool to choose data points from one plot and have them automatically
highlighted in a second plot (:ref:`userguide_data_linked_selection`).

At the most basic level, a |ColumnDataSource| is simply a mapping between column
names and lists of data. The |ColumnDataSource| takes a ``data`` parameter which is a dict,
with string column names as keys and lists (or arrays) of data values as values. If one positional
argument is passed to the |ColumnDataSource| initializer, it will be taken as ``data``. Once the
|ColumnDataSource| has been created, it can be passed into the ``source`` parameter of
plotting methods which allows you to pass a column's name as a stand-in for the data values:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.models import ColumnDataSource

    data = {'x_values': [1, 2, 3, 4, 5],
            'y_values': [6, 7, 2, 3, 6]}

    source = ColumnDataSource(data=data)

    p = figure()
    p.circle(x='x_values', y='y_values', source=source)

.. note::
    There is an implicit assumption that all the columns in a given ``ColumnDataSource``
    all have the same length at all times. For this reason, it is usually preferable to
    update the ``.data`` property of a data source "all at once".


Pandas
~~~~~~

The ``data`` parameter can also be a Pandas ``DataFrame`` or ``GroupBy`` object.

.. code-block:: python

   source = ColumnDataSource(df)

If a ``DataFrame`` is used, the CDS will have columns corresponding to the columns of
the ``DataFrame``. The index of the ``DataFrame`` will be reset, so if the ``DataFrame``
has a named index column, then CDS will also have a column with this name. However,
if the index name is ``None``, then the CDS will be assigned a generic name.
It will be ``index`` if it is available, and ``level_0`` otherwise.

Pandas MultiIndex
~~~~~~~~~~~~~~~~~
All ``MultiIndex`` columns and indices will be flattened before forming the
``ColumnsDataSource``. For the index, an index of tuples will be created, and the
names of the ``MultiIndex`` joined with an underscore. The column names will also
be joined with an underscore. For example:

.. code-block:: python

    df = pd.DataFrame({('a', 'b'): {('A', 'B'): 1, ('A', 'C'): 2},
                       ('b', 'a'): {('A', 'C'): 7, ('A', 'B'): 8},
                       ('b', 'b'): {('A', 'D'): 9, ('A', 'B'): 10}})
    cds = ColumnDataSource(df)

will result in a column named ``index`` with ``[(A, B), (A, C), (A, D)]`` and columns
named ``a_b``, ``b_a``, and ``b_b``. This process will fail for non-string column names,
so flatten the ``DataFrame`` manually in that case.

Pandas GroupBy
~~~~~~~~~~~~~~

.. code-block:: python

    group = df.groupby(('colA', 'ColB'))
    source = ColumnDataSource(group)

If a ``GroupBy`` object is used, the CDS will have columns corresponding to the result of
calling ``group.describe()``. The ``describe`` method generates columns for statistical measures
such as ``mean`` and ``count`` for all the non-grouped original columns. The resulting ``DataFrame``
has ``MultiIndex`` columns with the original column name and the computed measure, so it
will be flattened using the aforementioned scheme. For example, if a
``DataFrame`` has columns ``'year'`` and ``'mpg'``. Then passing ``df.groupby('year')``
to a CDS will result in columns such as ``'mpg_mean'``

Note this capability to adapt ``GroupBy`` objects may only work with Pandas ``>=0.20.0``.

Streaming
~~~~~~~~~

|ColumnDataSource| streaming is an efficient way to append new data to a CDS. By using the
``stream`` method, Bokeh only sends new data to the browser instead of the entire dataset.
The ``stream`` method takes a ``new_data`` parameter containing a dict mapping column names
to sequences of data to be appended to the respective columns. It additionally takes an optional
argument ``rollover``, which is the maximum length of data to keep (data from the beginning of the
column will be discarded). The default ``rollover`` value of None allows data to grow unbounded.

.. code-block:: python

    source = ColumnDataSource(data=dict(foo=[], bar=[]))

    # has new, identical-length updates for all columns in source
    new_data = {
        'foo' : [10, 20],
        'bar' : [100, 200],
    }

    source.stream(new_data)

For an example that uses streaming, see :bokeh-tree:`examples/app/ohlc`.

Patching
~~~~~~~~

|ColumnDataSource| patching is an efficient way to update slices of a data source. By using the
``patch`` method, Bokeh only needs to send new data to the browser instead of the entire dataset.
The ``patch`` method should be passed a dict mapping column names to list of tuples that represent
a patch change to apply.

The tuples that describe patch changes are of the form:

.. code-block:: python

    (index, new_value)  # replace a single column value

    # or

    (slice, new_values) # replace several column values

For a full example, see :bokeh-tree:`examples/howto/patch_app.py`.

Transforming Data
-----------------

We have seen above how data can be added to a ``ColumnDataSource`` to drive
Bokeh plots. This can include raw data or data that we explicitly transform
ourselves, for example a column of colors created to control how the Markers
in a scatter plot should be shaded. It is also possible to specify transforms
that only occur in the browser. This can be useful to reduce both code (i.e.
not having to color map data by hand) as well as the amount of data that has to
be sent into the browser (only the raw data is sent, and colormapping occurs
in the client).

In this section we examine some of the different transform objects that are
available.

Colors
~~~~~~

To perform linear colormapping in the browser, the
:func:`~bokeh.transform.linear_cmap` function may be used. It accepts the name
of a ``ColumnDataSource`` column to colormap, a palette (which can be a built-in
palette name or an actual list of colors), and min/max values for the color
mapping range. The result can be passed to a color property on glyphs:

.. code-block:: python

     fill_color=linear_cmap('counts', 'Viridis256', min=0, max=10)

A complete example is shown here:

.. bokeh-plot:: docs/user_guide/examples/data_transforming_colors.py
    :source-position: above

Besides :func:`~bokeh.transform.linear_cmap` there is also
:func:`~bokeh.transform.log_cmap` to perform color mapping on a log scale, as
well as :func:`~bokeh.transform.factor_cmap` to colormap categorical data (see
the example below).

Markers
~~~~~~~

It is also possible to map categorical data to marker types. The example
below shows the use of :func:`~bokeh.transform.factor_mark` to display different
markers or different categories in the input data. It also demonstrates the use
of :func:`~bokeh.transform.factor_cmap` to colormap those same categories:

.. bokeh-plot:: docs/user_guide/examples/data_transforming_markers.py
    :source-position: above

.. note::
    The :func:`~bokeh.transform.factor_mark` transform is primarily only useful
    with the ``scatter`` glyph method, since only the ``Scatter`` glyph can be
    parameterized by marker type.

CustomJSTransform
~~~~~~~~~~~~~~~~~

In addition to the built-in transforms above, there is also a ``CustomJSTransform``
that allows for specifying arbitrary JavaScript code to perform a transform step
on ColumnDataSource data. Typically, the ``v_func`` (for "vectorized" function)
is provided (less commonly, a scalar equivalent ``func`` may also be needed).
The ``v_func`` code should expect an array of inputs in the variable ``xs``, and
return a JavaScript array with the transformed values:

.. code-block:: python

    v_func = """
        const first = xs[0]
        const norm = new Float64Array(xs.length)
        for (let i = 0; i < xs.length; i++) {
            norm[i] = xs[i] / first
        }
        return norm
    """
    normalize = CustomJSTransform(v_func=v_func)

    plot.line(x='aapl_date', y=transform('aapl_close', normalize), line_width=2,
              color='#cf3c4d', alpha=0.6,legend="Apple", source=aapl_source)

The above code converts raw price data into a sequence of normalized returns
relative to the first data point. The full result is shown below:

.. bokeh-plot:: docs/user_guide/examples/data_transforming_customjs_transform.py
    :source-position: none


Filtering Data
--------------

It's often desirable to focus in on a portion of data that has been subsampled or filtered
from a larger dataset. Bokeh allows you to specify a view of a data source that represents
a subset of data. By having a view of the data source, the underlying data doesn't need to
be changed and can be shared across plots. The view consists of one or more filters that
select the rows of the data source that should be bound to a specific glyph.

To plot with a subset of data, you can create a |CDSView| and pass it in as a ``view``
argument to the renderer-adding methods on the |Figure|, such as ``figure.circle``. The
|CDSView| has two properties, ``source`` and ``filters``. ``source`` is the |ColumnDataSource|
that the view is associated with. ``filters`` is a list of |Filter| objects, listed and
described below.

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.models import ColumnDataSource, CDSView

    source = ColumnDataSource(some_data)
    view = CDSView(source=source, filters=[filter1, filter2])

    p = figure()
    p.circle(x="x", y="y", source=source, view=view)

IndexFilter
~~~~~~~~~~~

The |IndexFilter| is the simplest filter type. It has an ``indices`` property which is a
list of integers that are the indices of the data you want to be included in the plot.

.. bokeh-plot:: docs/user_guide/examples/data_filtering_index_filter.py
    :source-position: above


BooleanFilter
~~~~~~~~~~~~~

A |BooleanFilter| selects rows from a data source through a list of True or False values
in its ``booleans`` property.

.. bokeh-plot:: docs/user_guide/examples/data_filtering_boolean_filter.py
    :source-position: above

GroupFilter
~~~~~~~~~~~

The |GroupFilter| allows you to select rows from a dataset that have a specific value for
a categorical variable. The |GroupFilter| has two properties, ``column_name``, the name of
the column in the |ColumnDataSource|, and ``group``, the value of the column to select for.

In the example below, ``flowers`` contains a categorical variable ``species`` which is
either ``setosa``, ``versicolor``, or ``virginica``.

.. bokeh-plot:: docs/user_guide/examples/data_filtering_group_filter.py
    :source-position: above

CustomJSFilter
~~~~~~~~~~~~~~

You can also create a |CustomJSFilter| with your own functionality. To do this,
use JavaScript or TypeScript to write code that returns either a list of indices
or a list of booleans that represents the filtered subset. The |ColumnDataSource|
that is associated with the |CDSView| this filter is added to will be available
at render time with the variable ``source``.

Javascript
''''''''''

To create a |CustomJSFilter| with custom functionality written in JavaScript,
pass in the JavaScript code as a string to the parameter ``code``:

.. code-block:: python

    custom_filter = CustomJSFilter(code='''
    var indices = [];

    // iterate through rows of data source and see if each satisfies some constraint
    for (var i = 0; i < source.get_length(); i++){
        if (source.data['some_column'][i] == 'some_value'){
            indices.push(true);
        } else {
            indices.push(false);
        }
    }
    return indices;
    ''')

.. _userguide_data_ajax_data_source:

AjaxDataSource
--------------

Bokeh server applications make it simple to update and stream data to data
sources, but sometimes it is desirable to have similar functionality in
standalone documents. The :class:`~bokeh.models.sources.AjaxDataSource`
provides this capability.

The ``AjaxDataSource`` is configured with a URL to a REST endpoint and a
polling interval. In the browser, the data source will request data from the
endpoint at the specified interval and update the data locally. Existing
data may either be replaced entirely or appended to (up to a configurable
``max_size``). The endpoint that is supplied should return a JSON dict that
matches the standard ``ColumnDataSource`` format:

.. code-block:: python

    {
        'x' : [1, 2, 3, ...],
        'y' : [9, 3, 2, ...]
    }

Otherwise, using an ``AjaxDataSource`` is identical to using a standard
``ColumnDataSource``:

.. code-block:: python

    source = AjaxDataSource(data_url='http://some.api.com/data',
                            polling_interval=100)

    # Use just like a ColumnDataSource
    p.circle('x', 'y', source=source)

A full example (shown below) can be seen at
:bokeh-tree:`examples/howto/ajax_source.py`

.. image:: /_images/ajax_streaming.gif

.. _userguide_data_linked_selection:

Linked Selection
----------------

Using the same |ColumnDataSource| in the two plots below allows their selections to be
shared.

.. bokeh-plot:: docs/user_guide/examples/interaction_linked_brushing.py
    :source-position: above

.. _userguide_data_linked_selection_with_filtering:

Linked Selection with Filtered Data
-----------------------------------

With the ability to specify a subset of data to be used for each glyph renderer, it is
easy to share data between plots even when the plots use different subsets of data.
By using the same |ColumnDataSource|, selections and hovered inspections of that data source
are automatically shared.

In the example below, a |CDSView| is created for the second plot that specifies the subset
of data in which the y values are either greater than 250 or less than 100. Selections in either
plot are automatically reflected in the other. And hovering on a point in one plot will highlight
the corresponding point in the other plot if it exists.

.. bokeh-plot:: docs/user_guide/examples/data_linked_brushing_subsets.py
    :source-position: above

Other Data Types
----------------

Bokeh also has the capability to render network graph data and geographical data.
For more information about how to set up the data for these types of plots, see
:ref:`userguide_graph` and :ref:`userguide_geo`.

.. |ColumnDataSource| replace:: :class:`~bokeh.models.sources.ColumnDataSource`
.. |CDSView| replace:: :class:`~bokeh.models.sources.CDSView`
.. |Filter| replace:: :class:`~bokeh.models.filters.Filter`
.. |IndexFilter| replace:: :class:`~bokeh.models.filters.IndexFilter`
.. |BooleanFilter| replace:: :class:`~bokeh.models.filters.BooleanFilter`
.. |GroupFilter| replace:: :class:`~bokeh.models.filters.GroupFilter`
.. |CustomJSFilter| replace:: :class:`~bokeh.models.filters.CustomJSFilter`
.. |Figure| replace:: :class:`~bokeh.plotting.Figure`
.. |DataTable| replace:: :class:`~bokeh.models.widgets.tables.DataTable`
