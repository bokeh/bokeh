.. _userguide_data:

Providing data
==============

The basis for any data visualization is the underlying data. This section
describes the various ways to provide data to Bokeh, from passing data values
directly, to creating a |ColumnDataSource| (CDS) and filtering the data with a
|CDSView|.

.. _userguide_data_python_lists:

Providing data with Python lists
--------------------------------

Use standard Python lists of data to pass values directly into a plotting
function.

In this example, the lists ``x_values`` and ``y_values`` pass data
to the :func:`~bokeh.plotting.Figure.circle`
:ref:`plotting function <userguide_plotting>`:

.. code-block:: python

    from bokeh.plotting import figure

    x_values = [1, 2, 3, 4, 5]
    y_values = [6, 7, 2, 3, 6]

    p = figure()
    p.circle(x=x_values, y=y_values)

When you pass data like this, Bokeh automatically creates a |ColumnDataSource|
for you.

However, learning to create and use a |ColumnDataSource| yourself gives you
access to more advanced options, such as streaming data, sharing data between
plots, and filtering data.

.. _userguide_data_cds:

Providing data as a ColumnDataSource
------------------------------------

The |ColumnDataSource| (CDS) is the core of most Bokeh plots. It provides the
data to the glyphs of your plot.

Using a |ColumnDataSource| allows you to share data between multiple plots
and widgets. For example: If you use a single ColumnDataSource together with
multiple renderers, those renderers also share information about data you
select with a select tool from Bokeh's toolbar (see
:ref:`userguide_data_linked_selection`).

Think of a ColumnDataSource as a collection of lists of data that each have
their own, unique column name.

To create a |ColumnDataSource| object, you need a Python dictionary. The column
names are the key of this dictionary, while the data values are the
dictionary's value. Once you have a ColumnDataSource set up, you can pass it
to a plotting function with the ``source`` argument:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.models import ColumnDataSource

    # generate a Python dict as the basis of your ColumnDataSource
    data = {'x_values': [1, 2, 3, 4, 5],
            'y_values': [6, 7, 2, 3, 6]}

    # generate a ColumnDataSource by passing the dict
    source = ColumnDataSource(data=data)

    # create a plot using the ColumnDataSource's two columns
    p = figure()
    p.circle(x='x_values', y='y_values', source=source)

In order to use a ColumnDataSource with a plotting function, you need to pass
at least these three arguments:

* ``x``: the name of the ColumnDataSource's column that contains the data for
  the x values of your plot
* ``y``: the name of the ColumnDataSource's column that contains the data for
  the y values of your plot
* ``source``: the name of the ColumnDataSource that contains the columns you
  just referenced for the ``x`` and ``y`` arguments.

.. note::
    Bokeh assumes that all columns in a ColumnDataSource each have the same
    length at all times. For this reason, make sure to always update all columns
    of a ColumnDataSource at the same time.

.. _userguide_data_cds_pandas_data_frame:

Using a pandas DataFrame
~~~~~~~~~~~~~~~~~~~~~~~~

The ``data`` parameter can also be a pandas ``DataFrame`` or ``GroupBy`` object:

.. code-block:: python

   source = ColumnDataSource(df)

If you use a pandas ``DataFrame``, the resulting ColumnDataSource in Bokeh will
have columns that correspond to the columns of the ``DataFrame``. The naming of
the columns follows these rules:

* The index of the ``DataFrame`` will be reset, so if the ``DataFrame`` has a
  named index column, the ColumnDataSource will also have a column with this
  name.
* If the index name is ``None``, the ColumnDataSource will have a generic name:
  either ``index`` (if that name is available), or ``level_0``.

.. _userguide_data_cds_pandas_multi_index:

Using a pandas MultiIndex
~~~~~~~~~~~~~~~~~~~~~~~~~
If you use a pandas ``MultiIndex`` as the basis for a Bokeh
``ColumnsDataSource``, Bokeh flattens the columns and indices before creating
the ColumnDataSource. For the index, Bokeh creates an index of tuples joins the
names of the ``MultiIndex`` with an underscore. The column names will also be
joined with an underscore. For example:

.. code-block:: python

    df = pd.DataFrame({('a', 'b'): {('A', 'B'): 1, ('A', 'C'): 2},
                       ('b', 'a'): {('A', 'C'): 7, ('A', 'B'): 8},
                       ('b', 'b'): {('A', 'D'): 9, ('A', 'B'): 10}})
    cds = ColumnDataSource(df)

This will result in a column named ``index`` with ``[(A, B), (A, C), (A, D)]``,
as well as columns named ``a_b``, ``b_a``, and ``b_b``.

This process only works with column names that are strings. If you are using
non-string column names, you need to flatten the ``DataFrame`` manually before
you can use it as the basis of a Bokeh ``ColumnsDataSource``.

.. _userguide_data_cds_pandas_group_by:

Using pandas GroupBy
~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

    group = df.groupby(('colA', 'ColB'))
    source = ColumnDataSource(group)

If you use a pandas ``GroupBy`` object, the columns of the CDS correspond to the
result of calling ``group.describe()``. The ``describe`` method generates
columns for statistical measures such as ``mean`` and ``count`` for all the
non-grouped original columns.

The resulting ``DataFrame`` has ``MultiIndex`` columns with the original column
name and the computed measure, so it will be flattened using the rules described
above.

For example: If a ``DataFrame`` has the columns ``'year'`` and ``'mpg'``,
passing ``df.groupby('year')`` to a CDS will result in columns such as
``'mpg_mean'``.

.. note::
    Adapting ``GroupBy`` objects requires pandas version 0.20.0 or above.

.. _userguide_data_cds_streaming:

Streaming
~~~~~~~~~

|ColumnDataSource| streaming is an efficient way to append new data to a CDS.
When you use the :func:`~bokeh.models.sources.ColumnDataSource.stream` method,
Bokeh only sends new data to the browser, instead of sending the entire dataset.

The :func:`~bokeh.models.sources.ColumnDataSource.stream` method takes a
``new_data`` parameter. This parameter contains a dict which maps column names
to the sequences of data that you want appended to the respective columns.

The method takes an additional, optional argument ``rollover``. This is the
maximum length of data to keep (data from the beginning of the column will be
discarded). The default ``rollover`` value of ``None`` allows data to grow
unbounded.

.. code-block:: python

    source = ColumnDataSource(data=dict(foo=[], bar=[]))

    # has new, identical-length updates for all columns in source
    new_data = {
        'foo' : [10, 20],
        'bar' : [100, 200],
    }

    source.stream(new_data)

For an example that uses streaming, see :bokeh-tree:`examples/app/ohlc`.

.. _userguide_data_cds_patching:

Patching
~~~~~~~~

|ColumnDataSource| patching is an efficient way to update slices of a data
source. By using the :func:`~bokeh.models.sources.ColumnDataSource.patch`
method, Bokeh only sends new data to the browser instead of the entire
dataset.

The :func:`~bokeh.models.sources.ColumnDataSource.patch` requires a dict which
maps column names to list of tuples that represent a patch change to apply.

Examples of tuples that you can use with
:func:`~bokeh.models.sources.ColumnDataSource.patch`:

.. code-block:: python

    (index, new_value)  # replace a single column value

    # or

    (slice, new_values) # replace several column values

For a full example, see :bokeh-tree:`examples/howto/patch_app.py`.

.. _userguide_data_transforming:

Transforming data
-----------------

So far, you have added data to a ``ColumnDataSource`` to control Bokeh plots.
However, you can also perform some data operations directly in the browser.

Dynamically calculating color maps in the browser, for example, can reduce the
amount of Python code. If the necessary calculations for color mapping happen
directly in the browser, you will also need to send less data.

This section provides an overview over the different transform objects that are
available.

Client-side color mapping
~~~~~~~~~~~~~~~~~~~~~~~~~

Use the :func:`~bokeh.transform.linear_cmap` function to perform linear
color mapping directly in the browser. This function accepts the following
arguments:

* The name of a ``ColumnDataSource`` column containing the data to map colors to
* A palette (which can be a :ref:`built-in palette name<bokeh.palettes>` or a
  list of colors)
* ``min`` and ``max`` values for the color mapping range.

Pass the result as a ``color`` property of a glyph:

.. code-block:: python

     fill_color=linear_cmap('counts', 'Viridis256', min=0, max=10)

For example:

.. bokeh-plot:: docs/user_guide/examples/data_transforming_colors.py
    :source-position: above

In addition to :func:`~bokeh.transform.linear_cmap`, there are two similar
functions:

* :func:`~bokeh.transform.log_cmap` for color mapping on a log scale
* :func:`~bokeh.transform.factor_cmap` for color mapping categorical data (see
the example below).

Mapping marker types
~~~~~~~~~~~~~~~~~~~~

When you use categorical data, you can use different markers for each of the
categories in your data. Use the :func:`~bokeh.transform.factor_mark`
function to automatically assign different markers to different categories:

.. bokeh-plot:: docs/user_guide/examples/data_transforming_markers.py
    :source-position: above

This example also uses :func:`~bokeh.transform.factor_cmap` to color map those
same categories.

.. note::
    The :func:`~bokeh.transform.factor_mark` transform is primarily only useful
    with the ``scatter`` glyph method, since only the ``Scatter`` glyph can be
    parameterized by marker type.

Including JavaScript code with CustomJSTransform
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

In addition to the built-in transformation functions above, you can use your own
JavaScript code. Use the :func:`~bokeh.models.transforms.CustomJSTransform`
function to add custom JavaScript code that is executed in the browser.

The example below uses the :func:`~bokeh.models.transforms.CustomJSTransform`
function with the argument ``v_func``. ``v_func`` is short for "vectorized
function". The JavaScript code you supply to ``v_func`` needs to expect an array
of inputs in the variable ``xs``, and return a JavaScript array with the
transformed values:

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

The code in this example converts raw price data into a sequence of normalized
returns that are relative to the first data point:

.. bokeh-plot:: docs/user_guide/examples/data_transforming_customjs_transform.py
    :source-position: none

.. _userguide_data_filtering:

Filtering data
--------------

Bokeh uses a concept called "view" to select subsets of data. Views are
represented by Bokeh's |CDSView| class. When you use a view, you can use one or
more filters to select specific data points without changing the underlying
data. You can also share those views between different plots.

To plot with a filtered subset of data, pass a |CDSView| to the ``view``
argument of any renderer methods that are part of Bokeh's |Figure| class.

A |CDSView| has two properties, ``source`` and ``filters``:

* ``source`` is the |ColumnDataSource| that the you want to apply the filters to
* ``filters`` is a list of |Filter| objects, listed and described below.

In this example, you create a |CDSView| called ``view`` which uses the
ColumnDataSource ``source`` and a list of two filters, ``filter1`` and
``filter2``. ``view`` is then passed to a :func:`~bokeh.plotting.Figure.circle`
renderer function:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.models import ColumnDataSource, CDSView

    source = ColumnDataSource(some_data)
    view = CDSView(source=source, filters=[filter1, filter2])

    p = figure()
    p.circle(x="x", y="y", source=source, view=view)

IndexFilter
~~~~~~~~~~~

The |IndexFilter| is the simplest filter type. It has an ``indices`` property
which is a list of integers that are the indices of the data you want to include
in your plot.

.. bokeh-plot:: docs/user_guide/examples/data_filtering_index_filter.py
    :source-position: above


BooleanFilter
~~~~~~~~~~~~~

A |BooleanFilter| selects rows from a data source using a list of ``True`` or
``False`` values in its ``booleans`` property.

.. bokeh-plot:: docs/user_guide/examples/data_filtering_boolean_filter.py
    :source-position: above

GroupFilter
~~~~~~~~~~~

The |GroupFilter| is a filter for categorical data. With this filter, you can
select rows from a dataset that are members of a specific category.

The |GroupFilter| has two properties:
* ``column_name``: the name of the column in the |ColumnDataSource| to apply the
  filter to
* ``group``: the name of the category to select for

In the example below, the data set ``flowers`` contains a categorical variable
called ``species``. All data belongs to one of the three species categories
``setosa``, ``versicolor``, or ``virginica``. The second plot in this example
uses a |GroupFilter| to only display data points that are a member of the
category ``setosa``:

.. bokeh-plot:: docs/user_guide/examples/data_filtering_group_filter.py
    :source-position: above

CustomJSFilter
~~~~~~~~~~~~~~

You can also use your own JavaScript or TypeScript code to create customized
filters. To include your custom filter code, use Bokeh's |CustomJSFilter| class.
Pass your code as a string to the parameter ``code`` of the CustomJSFilter.

Your JavaScript or TypeScript code needs to return either a list of indices or a
list of booleans that represents the filtered subset. You can access the
|ColumnDataSource| you are using with |CDSView| through the variable ``source``:

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

Updating and streaming data works very well with
:ref:`Bokeh server applications<userguide_server>`. However, it is also possible
to use a similar functionality in standalone documents. The
:class:`~bokeh.models.sources.AjaxDataSource` provides this capability, without
requiring a Bokeh server.

To set up an ``AjaxDataSource``, you need to configure it with a URL to a REST
endpoint and a polling interval.

In the browser, the data source requests data from the endpoint at the specified
interval. It then uses the data from the endpoint to update the data locally.
Updating data locally can happen in two ways: either by replacing the existing
local data entirely or by appending the new data to existing data (up to a
configurable ``max_size``).

The endpoint that you are using with your ``AjaxDataSource`` needs to return a
JSON dict that matches the standard
:ref:`ColumnDataSource format <userguide_data_cds>`:

.. code-block:: python

    {
        'x' : [1, 2, 3, ...],
        'y' : [9, 3, 2, ...]
    }

Otherwise, using an ``AjaxDataSource`` is identical to using a standard
``ColumnDataSource``:

.. code-block:: python

    # setup AjaxDataSource with URL and polling interval
    source = AjaxDataSource(data_url='http://some.api.com/data',
                            polling_interval=100)

    # use the AjaxDataSource just like a ColumnDataSource
    p.circle('x', 'y', source=source)

This a preview of what a stream of live data in Bokeh can look like using
``AjaxDataSource``:

.. image:: /_images/ajax_streaming.gif

For the full example, see :bokeh-tree:`examples/howto/ajax_source.py` in Bokeh's
GitHub repository.

.. _userguide_data_linked_selection:

Linked selection
----------------

You can share selections between two plots if both of the plots use to same
|ColumnDataSource|:

.. bokeh-plot:: docs/user_guide/examples/interaction_linked_brushing.py
    :source-position: above

.. _userguide_data_linked_selection_with_filtering:

Linked selection with filtered data
-----------------------------------

Using a |ColumnDataSource|, you can also have two plots use different subsets of
the same data. Both plots still share selections and hovered inspections through
the |ColumnDataSource| they are based on.

The following example demonstrates this behavior:

* The second plot is a subset of the data of the first plot. The second plot
  uses a |CDSView| to include only y values that are either greater than 250 or
  less than 100.
* If you make a selection with the ``BoxSelect`` tool in either plot, the
  selection is automatically reflected in the other plot as well.
* If you hover on a point in one plot, the corresponding point in the other plot
  is automatically highlighted as well, if it exists.

.. bokeh-plot:: docs/user_guide/examples/data_linked_brushing_subsets.py
    :source-position: above

Other data types
----------------

You can also use Bokeh to render network graph data and geographical data. For
more information about how to set up the data for these types of plots, see
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
