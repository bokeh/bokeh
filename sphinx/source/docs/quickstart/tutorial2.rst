.. _quickstart_tutorial2:

Tutorial 2: Combining multiple line graphs
##########################################

TBD TBD TBD TBD

The basic steps to creating plots with the |bokeh.plotting| interface are:

Prepare some data
    In this case, plain Python lists, but NumPy arrays or Pandas series also
    work.

Tell Bokeh where to generate output
    In this case, using |output_file|, with the filename ``"lines.html"``.
    Another option is |output_notebook| for use in Jupyter notebooks.

Call |figure|
    This creates a plot with typical default options and easy customization
    of title, tools, and axes labels.

Add renderers
    In this case, we use |Figure.line| for our data, specifying visual
    customizations like colors, legends, and widths.

Ask Bokeh to |show| or |save| the results
    These functions save the plot to an HTML file and optionally display it in
    a browser.

Steps three and four can be repeated to create more than one plot, as shown in
some of the examples below.

The |bokeh.plotting| interface is also quite handy if we need to customize
the output a bit more by adding more data series, glyphs, logarithmic axis,
and so on. It's easy to combine multiple glyphs together on one plot, as shown
below:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0]
    y0 = [i**2 for i in x]
    y1 = [10**i for i in x]
    y2 = [10**(i**2) for i in x]

    # output to static HTML file
    output_file("log_lines.html")

    # create a new plot
    p = figure(
       tools="pan,box_zoom,reset,save",
       y_axis_type="log", y_range=[0.001, 10**11], title="log axis example",
       x_axis_label='sections', y_axis_label='particles'
    )

    # add some renderers
    p.line(x, x, legend_label="y=x")
    p.circle(x, x, legend_label="y=x", fill_color="white", size=8)
    p.line(x, y0, legend_label="y=x^2", line_width=3)
    p.line(x, y1, legend_label="y=10^x", line_color="red")
    p.circle(x, y1, legend_label="y=10^x", fill_color="red", line_color="red", size=6)
    p.line(x, y2, legend_label="y=10^x^2", line_color="orange", line_dash="4 4")

    # show the results
    show(p)
