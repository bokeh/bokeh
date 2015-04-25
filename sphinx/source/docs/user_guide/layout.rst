.. _userguide_layout:

Laying Out Multiple Plots
=========================

.. contents::
    :local:
    :depth: 2

.. _userguide_layout_layout_vertical:

Vertical Layout
---------------

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

    # put all the plots in an HBox
    p = gridplot([[s1, s2], [None, s3]])

    # show the results
    show(p)


.. _userguide_layout_layout_form:

Form Layout
-----------


.. |gridplot| replace:: :func:`~bokeh.io.gridplot`
.. |hplot|    replace:: :func:`~bokeh.io.hplot`
.. |vplot|    replace:: :func:`~bokeh.io.vplot`
.. |vform|    replace:: :func:`~bokeh.io.vform`
