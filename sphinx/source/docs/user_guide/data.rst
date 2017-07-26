.. _userguide_data:

Sharing Data Between Plots
==========================

The |ColumnDataSource| is the core of most Bokeh plots, holding the data
that is visualized by the glyphs of the plot. With the |ColumnDataSource|,
it is easy to share data between multiple plots and widgets, such as the
|DataTable|. When the same |ColumnDataSource| is used to drive multiple
renderers, selections of the data source are also shared. Thus it is possible
to use a select tool to choose data points from one plot and have them automatically
highlighted in a second plot.

It is also possible to filter the data and create a view of the |ColumnDataSource|
to render only a portion of the full data set. By filtering the data source
instead of creating a new data source, it is possible to link plots with different
row-wise subsets of a |ColumnDataSource| and share selections between them.

Linked selection
----------------

Using the same |ColumnDataSource| in the two plots below allows their selections to be
shared.

.. bokeh-plot:: docs/user_guide/examples/interaction_linked_brushing.py
    :source-position: above

Filtering data
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

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.models import ColumnDataSource, CDSView, IndexFilter
    from bokeh.layouts import gridplot

    output_file("index_filter.html")

    source = ColumnDataSource(data=dict(x=[1, 2, 3, 4, 5], y=[1, 2, 3, 4, 5]))
    view = CDSView(source=source, filters=[IndexFilter([0, 2, 4])])

    tools = ["box_select", "hover", "reset"]
    p = figure(plot_height=300, plot_width=300, tools=tools)
    p.circle(x="x", y="y", size=10, hover_color="red", source=source)

    p_filtered = figure(plot_height=300, plot_width=300, tools=tools)
    p_filtered.circle(x="x", y="y", size=10, hover_color="red", source=source, view=view)

    show(gridplot([[p, p_filtered]]))

BooleanFilter
~~~~~~~~~~~~~

A |BooleanFilter| selects rows from a data source through a list of True or False values
in its ``booleans`` property.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.models import ColumnDataSource, CDSView, BooleanFilter
    from bokeh.layouts import gridplot

    output_file("boolean_filter.html")

    source = ColumnDataSource(data=dict(x=[1, 2, 3, 4, 5], y=[1, 2, 3, 4, 5]))
    booleans = [True if y_val > 2 else False for y_val in source.data['y']]
    view = CDSView(source=source, filters=[BooleanFilter(booleans)])

    tools = ["box_select", "hover", "reset"]
    p = figure(plot_height=300, plot_width=300, tools=tools)
    p.circle(x="x", y="y", size=10, hover_color="red", source=source)

    p_filtered = figure(plot_height=300, plot_width=300, tools=tools,
                        x_range=p.x_range, y_range=p.y_range)
    p_filtered.circle(x="x", y="y", size=10, hover_color="red", source=source, view=view)

    show(gridplot([[p, p_filtered]]))

GroupFilter
~~~~~~~~~~~

The |GroupFilter| allows you to select rows from a dataset that have a specific value for
a categorical variable. The |GroupFilter| has two properties, ``column_name``, the name of
column in the |ColumnDataSource|, and ``group``, the value of the column to select for.

In the example below, ``flowers`` contains a categorical variable ``species`` which is
either ``setosa``, ``versicolor``, or ``virginica``.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.layouts import gridplot
    from bokeh.models import ColumnDataSource, CDSView, GroupFilter

    from bokeh.sampledata.iris import flowers

    output_file("group_filter.html")

    source = ColumnDataSource(flowers)
    view1 = CDSView(source=source, filters=[GroupFilter(column_name='species', group='versicolor')])

    plot_size_and_tools = {'plot_height': 300, 'plot_width': 300,
                            'tools':['box_select', 'reset', 'help']}

    p1 = figure(title="Full data set", **plot_size_and_tools)
    p1.circle(x='petal_length', y='petal_width', source=source, color='black')

    p2 = figure(title="Setosa only", x_range=p1.x_range, y_range=p1.y_range, **plot_size_and_tools)
    p2.circle(x='petal_length', y='petal_width', source=source, view=view1, color='red')

    show(gridplot([[p1, p2]]))

CustomJSFilter
~~~~~~~~~~~~~~

You can also create a filter with custom functionality. This type of filter, the
|CustomJSFilter|, can be written in three ways, using Javascript, Coffeescript, or Python.
For all three, the custom code needs to return either a list of indices or a list of
booleans that represents the filtered subset. The |ColumnDataSource| that is associated
with the |CDSView| this filter is added to will be available at render time with the
variable ``source``.

Javascript
''''''''''

To create a |CustomJSFilter| with custom functionality written in JavaScript,
pass in the JavaScript code as a string to the parameter ``code``:

.. code-block:: python

    custom_filter = CustomJSFilter(code='''
    var indices = [];

    // iterate through rows of data source and see if each satisfies some constraint
    for (var i = 0; i <= source.get_length(); i++){
        if (source.data['some_column'][i] == 'some_value'){
            indices.push(true);
        } else {
            indices.push(false);
        }
    }
    return indices;
    ''')

Coffeescript
''''''''''''

You can also write code for the ``CustomJSFilter`` in `CoffeeScript`_, and
use the ``from_coffeescript`` class method, which accepts the ``code`` parameter:

.. code-block:: python

    custom_filter_coffee = CustomJSFilter.from_coffeescript(code='''
    z = source.data['z']
    indices = (i for i in [0...source.get_length()] when z[i] == 'b')
    return indices
    ''')

Python
''''''

A CustomJSFilter can also be created from a Python function. To use this functionality
you need the Flexx library (install with ``conda install -c bokeh flexx`` or
``pip install flexx``). It is also important to note that not all Python code is
supported, only the subset of Python that can be translated to Javascript using PyScript.

.. code-block:: python

    def custom_python_filter():
        z = source.data['z']
        indices = [True if z[i] == 'c' else False for i in range(len(z)) ]
        return indices

    custom_filter_pyscript = CustomJSFilter.from_py_func(custom_python_filter)

For more information about the subset of Python that is supported,
see the `PyScript documentation`_.

Full example
''''''''''''

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.layouts import row
    from bokeh.models import ColumnDataSource, CDSView, CustomJSFilter

    output_file("customjs_filter.html")

    data = {'x': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            'y': [10, 5, 2, 6, 1, 4, 8, 2, 7, 3],
            'z': ['a', 'a', 'a', 'b', 'b', 'b', 'c', 'c', 'c', 'c']}

    custom_filter = CustomJSFilter(code='''
    var indices = [];
    for (var i = 0; i <= source.data['z'].length; i++){
        if (source.data['z'][i] == 'a') {
            indices.push(true);
        } else {
            indices.push(false);
        }

    }
    return indices;
    ''')

    custom_filter_coffee = CustomJSFilter.from_coffeescript(code='''
    z = source.data['z']
    indices = (i for i in [0...source.get_length()] when z[i] == 'b')
    return indices
    ''')

    def custom_python_filter():
        z = source.data['z']
        indices = [True if z[i] == 'c' else False for i in range(len(z)) ]
        return indices

    #custom_filter_pyscript = CustomJSFilter.from_py_func(custom_python_filter)

    cds = ColumnDataSource(data)
    view1 = CDSView(source=cds, filters=[custom_filter])
    view2 = CDSView(source=cds, filters=[custom_filter_coffee])
    #view3 = CDSView(source=cds, filters=[custom_filter_pyscript])

    plot_size_and_tools = {'plot_height': 300, 'plot_width': 300,
                            'x_range':[0, 11], 'y_range':[0, 11]}

    p = figure(title="CustomJSFilter", **plot_size_and_tools)
    c1 = p.circle(x='x', y='y', source=cds, view=view1)
    c2 = p.circle(x='x', y='y', source=cds, view=view2)
    #c3 = p.circle(x='x', y='y', source=cds, view=view3)

    show(p)

Linked selection with filtered data
-----------------------------------

.. bokeh-plot:: docs/user_guide/examples/data_linked_brushing_subsets.py
    :source-position: above

.. |ColumnDataSource| replace:: :class:`~bokeh.models.sources.ColumnDataSource`
.. |CDSView| replace:: :class:`~bokeh.models.sources.CDSView`
.. |Filter| replace:: :class:`~bokeh.models.filters.Filter`
.. |IndexFilter| replace:: :class:`~bokeh.models.filters.IndexFilter`
.. |BooleanFilter| replace:: :class:`~bokeh.models.filters.BooleanFilter`
.. |GroupFilter| replace:: :class:`~bokeh.models.filters.GroupFilter`
.. |CustomJSFilter| replace:: :class:`~bokeh.models.filters.CustomJSFilter`
.. |Figure| replace:: :class:`~bokeh.plotting.figure.Figure`
.. |DataTable| replace:: :class:`~bokeh.models.widgets.tables.DataTable`

.. _CoffeeScript: http://coffeescript.org
.. _PyScript documentation: http://flexx.readthedocs.org/en/stable/pyscript
