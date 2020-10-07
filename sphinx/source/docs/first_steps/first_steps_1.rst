.. _first_steps_1:

First steps 1: creating a line chart
====================================

With just a few lines of Python code, Bokeh enables you to create an
interactive, JavaScript-powered visualization in your browser.

In this tutorial, you will use data from Python lists to create line charts.

Creating a simple line chart
----------------------------

Your first visualization will be a plot with a single line that looks like
this:

.. bokeh-plot::
    :source-position: none

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y = [6, 7, 2, 4, 5]

    # set output to static HTML file
    output_file("lines.html")

    # create a new plot with a title and axis labels
    p = figure(title="Simple line example", x_axis_label='x', y_axis_label='y')

    # add a line renderer with legend and line thickness
    p.line(x, y, legend_label="Temp.", line_width=2)

    # show the results
    show(p)

Follow these steps to recreate this simple line chart:

1. Import the necessary functions of the :class:`~bokeh.plotting` module:

    .. code-block:: python

        from bokeh.plotting import figure, output_file, show

2. Define two lists containing the data for your line chart:

    .. code-block:: python

        # prepare some data
        x = [1, 2, 3, 4, 5]
        y = [6, 7, 2, 4, 5]

3. Define the output file that Bokeh saves your line chart to:

    .. code-block:: python

        # set output to static HTML file
        output_file("lines.html")

4. Use the :func:`~bokeh.plotting.figure` function to create a new
   :class:`~bokeh.plotting.figure` object. Pass the following arguments:

   * ``title``: the title of your line chart
   * ``x_axis_label``: which data to use to generate labels for the chart's x axis
   * ``y_axis_label``: which data to use to generate labels for the chart's y axis

    .. code-block:: python

        # create a new plot with a title and axis labels
        p = figure(title="Simple line example", x_axis_label='x', y_axis_label='y')

5. Add a line graph to the Figure object you just created, using the
   :func:`~bokeh.plotting.Figure.line` function. Pass the following arguments:

   * your lists ``x`` and ``y`` containing the data
   * ``legend_label``: a string to label the line graph with
   * ``line_width``: define the line width (in pixels)

    .. code-block:: python

        # add a line renderer with legend and line thickness to the plot
        p.line(x, y, legend_label="Temp.", line_width=2)

6. Finally, use the :func:`~bokeh.plotting.show` function to generate your graph and
   open a web browser to display the generated HTML file.

    .. code-block:: python

        # show the results
        show(p)

When you execute these lines of code, Bokeh creates an output file
``"lines.html"``. Bokeh also opens a browser to display it.

This is what the completed code for your line graph should look like:

.. code-block:: python

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y = [6, 7, 2, 4, 5]

    # set output to static HTML file
    output_file("lines.html")

    # create a new plot with a title and axis labels
    p = figure(title="Simple line example", x_axis_label='x', y_axis_label='y')

    # add a line renderer with legend and line thickness to the plot
    p.line(x, y, legend_label="Temp.", line_width=2)

    # show the results
    show(p)

Combining multiple graphs
-------------------------

With Bokeh's |bokeh.plotting| interface, you can add more glyphs to your plot:

.. bokeh-plot::
    :source-position: none

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y1 = [6, 7, 2, 4, 5]
    y2 = [2, 3, 4, 5, 6]
    y3 = [4, 5, 5, 7, 2]

    # set output to static HTML file
    output_file("lines.html")

    # create a new plot with a title and axis labels
    p = figure(title="Multiple line example", x_axis_label='x', y_axis_label='y')

    # add multiple renderers
    p.line(x, y1, legend_label="Temp.", line_color="blue", line_width=2)
    p.line(x, y2, legend_label="Rate", line_color="red", line_width=2)
    p.line(x, y3, legend_label="Objects", line_color="green", line_width=2)

    # show the results
    show(p)

To add more line graphs to your plot, all you need to do is call the
:func:`~bokeh.plotting.Figure.line` function multiple times.

First, add more data as the basis for additional graphs:

.. code-block:: python

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y1 = [6, 7, 2, 4, 5]
    y2 = [2, 3, 4, 5, 6]
    y3 = [4, 5, 5, 7, 2]

Next, update the title for your plot by changing the string for the ``title``
argument in the :func:`~bokeh.plotting.figure` function:

.. code-block:: python

    # create a new plot with a title and axis labels
    p = figure(title="Multiple line example", x_axis_label='x', y_axis_label='y')

Finally, add more calls to the |Figure.line| function:

.. code-block:: python

    # add multiple renderers
    p.line(x, y1, legend_label="Temp.", line_color="blue", line_width=2)
    p.line(x, y2, legend_label="Rate", line_color="red", line_width=2)
    p.line(x, y3, legend_label="Objects", line_color="green", line_width=2)

This is what the completed code for your multi-line plot should look like:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y1 = [6, 7, 2, 4, 5]
    y2 = [2, 3, 4, 5, 6]
    y3 = [4, 5, 5, 7, 2]

    # set output to static HTML file
    output_file("lines.html")

    # create a new plot with a title and axis labels
    p = figure(title="Multiple line example", x_axis_label='x', y_axis_label='y')

    # add multiple renderers
    p.line(x, y1, legend_label="Temp.", line_color="blue", line_width=2)
    p.line(x, y2, legend_label="Rate", line_color="red", line_width=2)
    p.line(x, y3, legend_label="Objects", line_color="green", line_width=2)

    # show the results
    show(p)

Recap: building visualization
-----------------------------

You just completed all the basic steps that most visualizations with Bokeh's
|bokeh.plotting| interface require:

1. Preparing the data:
    You just used a plain Python list, but NumPy arrays or Pandas series also
    work.

2. Telling Bokeh what to do with the generated output:
    You used |output_file| with a filename to safe to a file. Another option
    is to use |output_notebook| to display your visualization directly in a
    Jupyter notebook.

3. Calling the |figure| function:
    This creates a plot with the most common default options. You
    can customize various properties of your plot, such as its title, tools,
    and axes labels.

4. Adding renderers:
    You just used |Figure.line| to create a line. Renderers have various
    options which allow you to specify visual attributes such as colors,
    legends, and widths.

5. Asking Bokeh to |show| or |save| the results:
    These functions either save your plot to an HTML file or display it in a
    browser.

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <userguide_plotting>`
.. |Figure.line|     replace:: :func:`~bokeh.plotting.Figure.line`
.. |figure| replace:: :func:`~bokeh.plotting.figure`
.. |output_file|     replace:: :func:`~bokeh.io.output_file`
.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`
