.. _tutorial_interaction:

Adding Interactions
===================

.. contents::
    :local:
    :depth: 2


Linking Plots
-------------


Linked Panning
~~~~~~~~~~~~~~

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, gridplot, output_file, show

    output_file("panning.html")

    x = list(range(11))
    y0 = x
    y1 = [10-x for x in x]
    y2 = [abs(x-5) for x in x]

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

Linked Brushing
~~~~~~~~~~~~~~~

.. bokeh-plot::
    :source-position: above

    from bokeh.models import ColumnDataSource
    from bokeh.plotting import figure, gridplot, output_file, show

    output_file("brushing.html")

    x = list(range(-20, 21))
    y0 = [abs(x) for x in x]
    y1 = [x**2 for x in x]

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

Adding Actions
--------------

Open URLs
~~~~~~~~~

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

Widgets and Callbacks
~~~~~~~~~~~~~~~~~~~~~

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


