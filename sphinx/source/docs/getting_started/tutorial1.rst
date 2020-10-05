.. _quickstart_tutorial1:

Tutorial 1: Creating a line chart
#################################

TBD TBD TBD TBD

Bokeh is a large library that exposes many capabilities, so this section is
only a quick tour of some common Bokeh use cases and workflows. For more
detailed information please consult the full :ref:`userguide`.

Let's begin with some examples.

Plotting data in basic Python lists as a line plot, including zoom,
pan, save, and other tools, is simple and straightforward:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y = [6, 7, 2, 4, 5]

    # output to static HTML file
    output_file("lines.html")

    # create a new plot with a title and axis labels
    p = figure(title="simple line example", x_axis_label='x', y_axis_label='y')

    # add a line renderer with legend and line thickness
    p.line(x, y, legend_label="Temp.", line_width=2)

    # show the results
    show(p)

When you execute this script, you will see that a new output file
``"lines.html"`` is created and that a browser automatically opens a new tab
to display it (for presentation purposes we have included the plot output
directly inline in this document).

