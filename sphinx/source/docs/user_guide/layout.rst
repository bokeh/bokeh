.. _userguide_layout:

Laying Out Multiple Plots
=========================

.. contents::
    :local:
    :depth: 2

Bokeh includes several layout options for arranging plots and widgets
in an HTML document. Note that the layout options here are all HTML
layouts; future Bokeh versions should offer the ability to lay out
multiple sub-plots on a single canvas.

.. _userguide_layout_layout_vertical:

Vertical Layout
---------------

To array a set of plots in a vertical fashion, use the |vplot| function:

.. bokeh-plot::
    :source-position: above

    from bokeh.io import output_file, show, vplot
    from bokeh.plotting import figure

    output_file("layout.html")

    x = list(range(11))
    y0 = x
    y1 = [10-x for x in x]
    y2 = [abs(x-5) for x in x]

    # create a new plot
    s1 = figure(width=250, plot_height=250, title=None)
    s1.circle(x, y0, size=10, color="navy", alpha=0.5)

    # create another one
    s2 = figure(width=250, height=250, title=None)
    s2.triangle(x, y1, size=10, color="firebrick", alpha=0.5)

    # create and another
    s3 = figure(width=250, height=250, title=None)
    s3.square(x, y2, size=10, color="olive", alpha=0.5)

    # put all the plots in a VBox
    p = vplot(s1, s2, s3)

    # show the results
    show(p)

.. _userguide_layout_layout_horizontal:

Horizontal Layout
-----------------

To array plots horizontally, use the |hplot| function:

.. bokeh-plot::
    :source-position: above

    from bokeh.io import hplot, output_file, show
    from bokeh.plotting import figure

    output_file("layout.html")

    x = list(range(11))
    y0 = x
    y1 = [10-x for x in x]
    y2 = [abs(x-5) for x in x]

    # create a new plot
    s1 = figure(width=250, plot_height=250, title=None)
    s1.circle(x, y0, size=10, color="navy", alpha=0.5)

    # create another one
    s2 = figure(width=250, height=250, title=None)
    s2.triangle(x, y1, size=10, color="firebrick", alpha=0.5)

    # create and another
    s3 = figure(width=250, height=250, title=None)
    s3.square(x, y2, size=10, color="olive", alpha=0.5)

    # put all the plots in an HBox
    p = hplot(s1, s2, s3)

    # show the results
    show(p)

.. _userguide_layout_layout_grid:

Grid Layout
-----------

Bokeh also provides a |gridplot| function that can be used to arrange
Bokeh Plots in grid layout. Note that |gridplot| also collects all
tools into a single toolbar, and the currently active tool is the same
for all plots in the grid. It is possible to leave "empty" spaces in
the grid by passing ``None`` instead of a plot object:

.. bokeh-plot::
    :source-position: above

    from bokeh.io import gridplot, output_file, show
    from bokeh.plotting import figure

    output_file("layout.html")

    x = list(range(11))
    y0 = x
    y1 = [10-x for x in x]
    y2 = [abs(x-5) for x in x]

    # create a new plot
    s1 = figure(width=250, plot_height=250, title=None)
    s1.circle(x, y0, size=10, color="navy", alpha=0.5)

    # create another one
    s2 = figure(width=250, height=250, title=None)
    s2.triangle(x, y1, size=10, color="firebrick", alpha=0.5)

    # create and another
    s3 = figure(width=250, height=250, title=None)
    s3.square(x, y2, size=10, color="olive", alpha=0.5)

    # put all the plots in a grid layout
    p = gridplot([[s1, s2], [None, s3]])

    # show the results
    show(p)


.. _userguide_layout_layout_form:

Form Layout
-----------

To include widgets in a layout, it is currently necessary to put everything
in a |vform| layout. You can see an example of this in the section
:ref:`userguide_interaction_actions_widget_callbacks`.

.. note::
    Improving the spelling and ease-of-use of widget layouts is an area
    of active work.

.. |gridplot| replace:: :func:`~bokeh.io.gridplot`
.. |hplot|    replace:: :func:`~bokeh.io.hplot`
.. |vplot|    replace:: :func:`~bokeh.io.vplot`
.. |vform|    replace:: :func:`~bokeh.io.vform`
