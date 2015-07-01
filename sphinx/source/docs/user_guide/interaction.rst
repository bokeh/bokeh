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

    x = list(range(-50, 51))
    y = list(x)

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = figure(y_range=(-100, 100), plot_width=400, plot_height=400)
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

    callback = Callback(args=dict(source=source), code="""
        var data = source.get('data');
        var f = cb_obj.get('value')
        x = data['x']
        y = data['y']
        for (i = 0; i < x.length; i++) {
            y[i] = f * x[i]
        }
        source.trigger('change');
    """)

    slider = Slider(start=-2, end=2, value=1, step=.1,
                    title="value", callback=callback)

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

.. _userguide_interaction_actions_hover_callbacks:

Callbacks for Hover
~~~~~~~~~~~~~~~~~~~

The HoverTool has a callback which comes with two pieces of built-in data: the
`index`, and the `geometry`. The `index` is the indices of any points that the
hover tool is over.

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

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
