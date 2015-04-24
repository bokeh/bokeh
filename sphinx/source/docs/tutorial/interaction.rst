.. _tutorial_interaction:

Adding Interactions
===================

.. contents::
    :local:
    :depth: 2

.. _tutorial_interaction_linking:

Linking Plots
-------------

It's often useful to link plots to add connected interactivity between plots.
This section shows an easy way to do it using the |bokeh.plotting| interface.

.. _tutorial_interaction_linked_panning:

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

.. _tutorial_interaction_linked_brushing:

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

.. _tutorial_interaction_actions:

Adding Actions
--------------

Bokeh exposes an increasing number of supported actions that can be specified
from the ``Python`` layer that results in an action on the ``javascript`` level without
the need of ``bokeh-server``.

.. _tutorial_interaction_actions_openurl:

Opening URLs
~~~~~~~~~~~~

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

.. _tutorial_interaction_actions_callbacks:

Widgets and Callbacks
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


Now you know how to add powerful javascript logic to be called when widgets
change.


.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
