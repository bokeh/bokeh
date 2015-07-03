.. _userguide_interaction:

Adding Interactions
===================

.. contents::
    :local:
    :depth: 2

.. _userguide_interaction_linking:

Linking Plots
-------------

It's often useful to link plots to add connected interactivity between plots.
This section shows an easy way to do it using the |bokeh.plotting| interface.

.. _userguide_interaction_linked_panning:

Linked Panning
~~~~~~~~~~~~~~

It's often desired to link pan or zooming actions across many plots. All that is
needed to enable this feature is to share range objects between |figure|
calls.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, gridplot, output_file, show

    output_file("panning.html")

    x = list(range(11))
    y0 = x
    y1 = [10-xx for xx in x]
    y2 = [abs(xx-5) for xx in x]

    # create a new plot
    s1 = figure(width=250, plot_height=250, title=None)
    s1.circle(x, y0, size=10, color="navy", alpha=0.5)

    # create a new plot and share both ranges
    s2 = figure(width=250, height=250, x_range=s1.x_range, y_range=s1.y_range, title=None)
    s2.triangle(x, y1, size=10, color="firebrick", alpha=0.5)

    # create a new plot and share only one range
    s3 = figure(width=250, height=250, x_range=s1.x_range, title=None)
    s3.square(x, y2, size=10, color="olive", alpha=0.5)

    p = gridplot([[s1, s2, s3]], toolbar_location=None)

    # show the results
    show(p)

Now you have learned how to link panning between multiple plots with the
|bokeh.plotting| interface.

.. _userguide_interaction_linked_brushing:

Linked Brushing
~~~~~~~~~~~~~~~

Linked brushing in Bokeh is expressed by sharing data sources between glyph
renderers. This is all Bokeh needs to understand that selections acted on one
glyph must pass to all other glyphs that share that same source.

The following code shows an example of linked brushing between circle glyphs on
two different |figure| calls.

.. bokeh-plot::
    :source-position: above

    from bokeh.models import ColumnDataSource
    from bokeh.plotting import figure, gridplot, output_file, show

    output_file("brushing.html")

    x = list(range(-20, 21))
    y0 = [abs(xx) for xx in x]
    y1 = [xx**2 for xx in x]

    # create a column data source for the plots to share
    source = ColumnDataSource(data=dict(x=x, y0=y0, y1=y1))

    TOOLS = "box_select,lasso_select,help"

    # create a new plot and add a renderer
    left = figure(tools=TOOLS, width=300, height=300, title=None)
    left.circle('x', 'y0', source=source)

    # create another new plot and add a renderer
    right = figure(tools=TOOLS, width=300, height=300, title=None)
    right.circle('x', 'y1', source=source)

    p = gridplot([[left, right]])

    show(p)

Now you have learned how to link brushing between plots.

.. _userguide_interaction_widgets:

Adding Widgets
--------------

Bokeh provides a simple default set of widgets, largely based off the Bootstrap
JavaScript library. In the future, it will be possible for users to wrap and use
other widget libararies, or their own custom widgets. By themselves, most widgets
are not useful. There are two ways to use widgets to drive interactions:

* Use the ``Callback`` action (see below). This will work in static HTML documents.
* Use the ``bokeh-server`` and set up event handlers with ``.on_change``.

The current value of interactive widgets is available from the ``.value``
attribute.

Button
~~~~~~

Bokeh provides a simple Button:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import Button
    from bokeh.io import output_file, show, vform

    output_file("button.html")

    button = Button(label="Foo", type="success")

    show(vform(button))

Checkbox Button Group
~~~~~~~~~~~~~~~~~~~~~

Bokeh also provides a checkbox button group, that can have multiple options
selected simultaneously:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import CheckboxButtonGroup
    from bokeh.io import output_file, show, vform

    output_file("checkbox_button_group.html")

    checkbox_button_group = CheckboxButtonGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])

    show(vform(checkbox_button_group))

Checkbox Group
~~~~~~~~~~~~~~

A standard checkbox:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import CheckboxGroup
    from bokeh.io import output_file, show, vform

    output_file("checkbox_group.html")

    checkbox_group = CheckboxGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=[0, 1])

    show(vform(checkbox_group))

Data Table
~~~~~~~~~~

Bokeh provides a sophisticated data table widget based on SlickGrid. Note
that since the table is configured with a data source object, any plots that
share this data source will automatically have selections linked between the
plot and the table (even in static HTML documents).

.. bokeh-plot::
    :source-position: below

    from datetime import date
    from random import randint

    from bokeh.models import ColumnDataSource
    from bokeh.models.widgets import DataTable, DateFormatter, TableColumn
    from bokeh.io import output_file, show, vform

    output_file("data_table.html")

    data = dict(
        dates=[ date(2014, 3, i+1) for i in range(10) ],
        downloads=[ randint(0, 100) for i in range(10) ],
    )
    source = ColumnDataSource(data)

    columns = [
        TableColumn(field="dates", title="Date", formatter=DateFormatter()),
        TableColumn(field="downloads", title="Downloads"),
    ]
    data_table = DataTable(source=source, columns=columns, width=400, height=280)

    show(vform(data_table))

Dropdown Menu
~~~~~~~~~~~~~

It is also possible to include Dropdown menus:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import Dropdown
    from bokeh.io import output_file, show, vform

    output_file("dropdown.html")

    menu = [("Item 1", "item_1"), ("Item 2", "item_2"), None, ("Item 3", "item_3")]
    dropdown = Dropdown(label="Dropdown button", type="warning", menu=menu)

    show(vform(dropdown))

MultiSelect
~~~~~~~~~~~

A multi-select widget to present multiple available options:

.. warning::
    MultiSelect is currently broken. See :bokeh-issue:`2495`

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import MultiSelect
    from bokeh.io import output_file, show, vform

    output_file("multi_select.html")

    multi_select = MultiSelect(title="Option:", value=["foo", "quux"],
                               options=["foo", "bar", "baz", "quux"])

    show(vform(multi_select))

Radio Button Group
~~~~~~~~~~~~~~~~~~

A radio button group can have at most one selected button at at time:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import RadioButtonGroup
    from bokeh.io import output_file, show, vform

    output_file("radio_button_group.html")

    radio_button_group = RadioButtonGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=0)

    show(vform(radio_button_group))

Radio Group
~~~~~~~~~~~

A radio group uses standard radio button appearance:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import RadioGroup
    from bokeh.io import output_file, show, vform

    output_file("radio_group.html")

    radio_group = RadioGroup(
        labels=["Option 1", "Option 2", "Option 3"], active=0)

    show(vform(radio_group))

Select
~~~~~~

A single selection widget:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import Select
    from bokeh.io import output_file, show, vform

    output_file("select.html")

    select = Select(title="Option:", value="foo", options=["foo", "bar", "baz", "quux"])

    show(vform(select))

Slider
~~~~~~

The Bokeh slider can be configured with ``start`` and ``end`` values, a ``step`` size,
an initial ``value`` and a ``title``:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import Slider
    from bokeh.io import output_file, show, vform

    output_file("slider.html")

    slider = Slider(start=0, end=10, value=1, step=.1, title="Stuff")

    show(vform(slider))

Tab Panes
~~~~~~~~~

Tab panes alloy multiple plots or layouts to be show in selectable tabs:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import Panel, Tabs
    from bokeh.io import output_file, show
    from bokeh.plotting import figure

    output_file("slider.html")

    p1 = figure(plot_width=300, plot_height=300)
    p1.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=20, color="navy", alpha=0.5)
    tab1 = Panel(child=p1, title="circle")

    p2 = figure(plot_width=300, plot_height=300)
    p2.line([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], line_width=3, color="navy", alpha=0.5)
    tab2 = Panel(child=p2, title="line")

    tabs = Tabs(tabs=[ tab1, tab2 ])

    show(tabs)

TextInput
~~~~~~~~~

A widget for collecting a line of text from a user:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import TextInput
    from bokeh.io import output_file, show, vform

    output_file("text_input.html")

    text_input = TextInput(value="default", title="Label:")

    show(vform(text_input))

Toggle Button
~~~~~~~~~~~~~

The toggle button holds an on/off state:

.. bokeh-plot::
    :source-position: below

    from bokeh.models.widgets import Toggle
    from bokeh.io import output_file, show, vform

    output_file("toggle.html")

    toggle = Toggle(label="Foo", type="success")

    show(vform(toggle))

.. _userguide_interaction_actions:

Defining Actions
----------------

Bokeh exposes an increasing number of supported actions that can be specified
from the ``Python`` layer that results in an action on the ``javascript`` level without
the need of ``bokeh-server``.

.. _userguide_interaction_actions_openurl:

OpenURL
~~~~~~~

Opening an URL when users click on a glyph (for instance a circle marker) is
a very popular feature. Bokeh lets users enable this feature by exposing an
OpenURL action object that can be passed to a Tap tool in order to have that
action called whenever the users clicks on the glyph.

The following code shows how to use the OpenURL action combined with a TapTool
to open an url whenever the user clicks on a circle.

.. bokeh-plot::
    :source-position: above

    from bokeh.models import ColumnDataSource, OpenURL, TapTool
    from bokeh.plotting import figure, output_file, show

    output_file("openurl.html")

    p = figure(plot_width=400, plot_height=400,
               tools="tap", title="Click the Dots")

    source = ColumnDataSource(data=dict(
        x = [1,2,3,4,5],
        y = [2,5,8,2,7],
        color=["navy", "orange", "olive", "firebrick", "gold"]
    ))

    p.circle('x', 'y', color='color', size=20, source=source)

    url = "http://www.colors.commutercreative.com/@color/"
    taptool = p.select(type=TapTool)
    taptool.action=OpenURL(url=url)

    show(p)

Now you have learned how to open an URL when the user clicks on a glyph.

.. _userguide_interaction_actions_widget_callbacks:

Callbacks for Widgets
~~~~~~~~~~~~~~~~~~~~~

Bokeh lets you express even more advanced actions that must be called on
the Javascript side in order to add custom logic and interactivity when a
widget is used. For instance, we may want to change the data of a plot when
a user clicks on a button or changes a slider Widget.

Custom actions like these can be set using a Callback object and passing it
as the ``callback`` argument to a Widget object.

The code below shows an example of Callback set on a slider Widget that
changes the source of a plot when the slider is used.

.. bokeh-plot::
    :source-position: above

    from bokeh.io import vform
    from bokeh.models import Callback, ColumnDataSource, Slider
    from bokeh.plotting import figure, output_file, show

    output_file("callback.html")

    x = [x*0.005 for x in range(0, 200)]
    y = x

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = figure(plot_width=400, plot_height=400)
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

    callback = Callback(args=dict(source=source), code="""
        var data = source.get('data');
        var f = cb_obj.get('value')
        x = data['x']
        y = data['y']
        for (i = 0; i < x.length; i++) {
            y[i] = Math.pow(x[i], f)
        }
        source.trigger('change');
    """)

    slider = Slider(start=0.1, end=4, value=1, step=.1, title="power", callback=callback)

    layout = vform(slider, plot)

    show(layout)

.. _userguide_interaction_actions_tool_callbacks:

Callbacks for Tools
~~~~~~~~~~~~~~~~~~~

Bokeh allows for some tool events to trigger custom Javascript callbacks that
have access to the tool's attributes. Below, a callback on the BoxSelectTool
uses the selection box dimensions (accessed in the geometry field of the
cb_data object that is injected into the Callback code attribute), in order to
add a Rect glyph to the plot with identical dimensions.

.. bokeh-plot::
    :source-position: above

    from bokeh.models import Callback, ColumnDataSource, BoxSelectTool, Range1d, Rect
    from bokeh.plotting import figure, output_file, show

    output_file("boxselecttool_callback.html")

    source = ColumnDataSource(data=dict(x=[], y=[], width=[], height=[]))

    callback = Callback(args=dict(source=source), code="""
        // get data source from Callback args
        var data = source.get('data');

        /// get BoxSelectTool dimensions from cb_data parameter of Callback
        var geometry = cb_data['geometry'];

        /// calculate Rect attributes
        var width = geometry['x1'] - geometry['x0'];
        var height = geometry['y1'] - geometry['y0'];
        var x = geometry['x0'] + width/2;
        var y = geometry['y0'] + height/2;

        /// update data source with new Rect attributes
        data['x'].push(x);
        data['y'].push(y);
        data['width'].push(width);
        data['height'].push(height);

        // trigger update of data source
        source.trigger('change');
    """)

    box_select = BoxSelectTool(callback=callback)

    p = figure(plot_width=400,
               plot_height=400,
               tools=[box_select],
               title="Select Below",
               x_range=Range1d(start=0.0, end=1.0),
               y_range=Range1d(start=0.0, end=1.0))

    rect = Rect(x='x',
                y='y',
                width='width',
                height='height',
                fill_alpha=0.3,
                fill_color='#009933')

    p.add_glyph(source, rect, selection_glyph=rect, nonselection_glyph=rect)
    show(p)

.. _userguide_interaction_actions_selection_callbacks:

Callbacks for Selections
~~~~~~~~~~~~~~~~~~~~~~~~

Bokeh also provides the means to specify the same kind of callback to be
executed whenever a selection changes. As a simple demonstration, the example
below simply copies selected points on the first plot to the second. However,
more sophisticated actions and computations are easily constructed in a
similar way.

.. bokeh-plot::
    :source-position: above

    from random import random
    from bokeh.models import Callback, ColumnDataSource
    from bokeh.plotting import hplot, figure, output_file, show

    output_file("callback.html")

    x = [random() for x in range(500)]
    y = [random() for y in range(500)]

    s1 = ColumnDataSource(data=dict(x=x, y=y))
    p1 = figure(plot_width=400, plot_height=400, tools="lasso_select", title="Select Here")
    p1.circle('x', 'y', source=s1, alpha=0.6)

    s2 = ColumnDataSource(data=dict(x=[], y=[]))
    p2 = figure(plot_width=400, plot_height=400, x_range=(0,1), y_range=(0,1),
                tools="", title="Watch Here")
    p2.circle('x', 'y', source=s2, alpha=0.6)

    s1.callback = Callback(args=dict(s2=s2), code="""
        var inds = cb_obj.get('selected')['1d'].indices;
        var d1 = cb_obj.get('data');
        var d2 = s2.get('data');
        d2['x'] = []
        d2['y'] = []
        for (i = 0; i < inds.length; i++) {
            d2['x'].push(d1['x'][inds[i]])
            d2['y'].push(d1['y'][inds[i]])
        }
        s2.trigger('change');
    """)

    layout = hplot(p1, p2)

    show(layout)

Another more sophisticated example is shown below. It computes the average `y`
value of any selected points (including multiple disjoint selections), and draws
a line through that value.

.. bokeh-plot::
    :source-position: above

    from random import random
    from bokeh.models import Callback, ColumnDataSource
    from bokeh.plotting import figure, output_file, show

    output_file("callback.html")

    x = [random() for x in range(500)]
    y = [random() for y in range(500)]
    color = ["navy"] * len(x)

    s = ColumnDataSource(data=dict(x=x, y=y, color=color))
    p = figure(plot_width=400, plot_height=400, tools="lasso_select", title="Select Here")
    p.circle('x', 'y', color='color', size=8, source=s, alpha=0.4)

    s2 = ColumnDataSource(data=dict(ym=[0.5, 0.5]))
    p.line(x=[0,1], y='ym', color="orange", line_width=5, alpha=0.6, source=s2)

    s.callback = Callback(args=dict(s2=s2), code="""
        var inds = cb_obj.get('selected')['1d'].indices;
        var d = cb_obj.get('data');
        var ym = 0

        if (inds.length == 0) { return; }

        for (i = 0; i < d['color'].length; i++) {
            d['color'][i] = "navy"
        }
        for (i = 0; i < inds.length; i++) {
            d['color'][inds[i]] = "firebrick"
            ym += d['y'][inds[i]]
        }

        ym /= inds.length
        s2.get('data')['ym'] = [ym, ym]

        cb_obj.trigger('change');
        s2.trigger('change');
    """)

    show(p)

.. _userguide_interaction_actions_hover_callbacks:

Callbacks for Hover
~~~~~~~~~~~~~~~~~~~

The HoverTool has a callback which comes with two pieces of built-in data: the
`index`, and the `geometry`. The `index` is the indices of any points that the
hover tool is over.

.. note::
    Hovers are considered "inspections" and do not normally set the selection
    on a data source. In an upcoming release, it will be possible to specify an
    ``inspection_glyph`` that will update a glyphs appearance when it is
    hovered over, without the need for any callback to set the selection as is
    done below.

.. bokeh-plot::
    :source-position: above

    from bokeh.sampledata.glucose import data
    (x, y) = (data.ix['2010-10-06'].index.to_series(), data.ix['2010-10-06']['glucose'])

    from bokeh.plotting import figure, output_file, show
    from bokeh.models import ColumnDataSource, Circle, HoverTool, Callback

    output_file("hover_callback.html")

    # Basic plot setup
    p = figure(width=600, height=300, x_axis_type="datetime", tools="", toolbar_location=None, title='Hover over points')
    p.line(x, y, line_dash="4 4", line_width=1, color='gray')

    # Add a circle, that is visible only when selected
    source = ColumnDataSource({'x': x, 'y': y})
    invisible_circle = Circle(x='x', y='y', fill_color='gray', fill_alpha=0.05, line_color=None, size=20)
    visible_circle = Circle(x='x', y='y', fill_color='firebrick', fill_alpha=0.5, line_color=None, size=20)
    cr = p.add_glyph(source, invisible_circle, selection_glyph=visible_circle, nonselection_glyph=invisible_circle)

    # Add a hover tool, that selects the circle
    code = "source.set('selected', cb_data['index']);"
    callback = Callback(args={'source': source}, code=code)
    p.add_tools(HoverTool(tooltips=None, callback=callback, renderers=[cr], mode='hline'))

    show(p)

.. _userguide_interaction_actions_range_update_callbacks:

Callbacks for Range Update
~~~~~~~~~~~~~~~~~~~~~~~~~~

With Bokeh, ranges have a callback attribute that accept a Callback instance
and execute javascript code on range updates that are triggered by tool
interactions such as a box zoom, wheel scroll or pan.

.. bokeh-plot::
    :source-position: above

    import numpy as np

    from bokeh.plotting import output_file, figure, show, hplot
    from bokeh.models import ColumnDataSource, Callback, Rect

    output_file('range_update_callback.html')

    N = 4000

    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    radii = np.random.random(size=N) * 1.5
    colors = ["#%02x%02x%02x" % (r, g, 150) for r, g in zip(np.floor(50+2*x), np.floor(30+2*y))]

    source = ColumnDataSource({'x':[], 'y':[], 'width':[], 'height':[]})

    jscode="""
        var data = source.get('data');
        var start = range.get('start');
        var end = range.get('end');
        data['%s'] = [start + (end - start) / 2];
        data['%s'] = [end - start];
        source.trigger('change');
    """

    p1 = figure(title='Pan and Zoom Here', x_range=(0,100), y_range=(0,100),
                tools='box_zoom,wheel_zoom,pan,reset', plot_width=400, plot_height=400)
    p1.scatter(x,y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

    p1.x_range.callback = Callback(
        args=dict(source=source, range=p1.x_range), code=jscode % ('x', 'width'))
    p1.y_range.callback = Callback(
        args=dict(source=source, range=p1.y_range), code=jscode % ('y', 'height'))

    p2 = figure(title='See Zoom Window Here', x_range=(0,100), y_range=(0,100),
                tools='', plot_width=400, plot_height=400)
    p2.scatter(x,y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)
    rect = Rect(x='x', y='y', width='width', height='height', fill_alpha=0.1,
                line_color='black', fill_color='black')
    p2.add_glyph(source, rect)

    layout = hplot(p1, p2)
    show(layout)

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
