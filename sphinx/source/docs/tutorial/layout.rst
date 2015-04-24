.. _tutorial_layout:

Laying Out Multiple Plots
=========================

.. contents::
    :local:
    :depth: 2

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, vplot, output_file, show

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

    # put all the plots in an vbox
    p = vplot(s1, s2, s3)

    # show the results
    show(p)
