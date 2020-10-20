.. _first_steps_1:

First steps 1: creating a line chart
====================================

With just a few lines of Python code, Bokeh enables you to create
interactive, JavaScript-powered visualizations displayable in a web browser.

The basic idea of Bokeh is a two-step process: First, you select from Bokehs
building blocks to create your visualization. Second, you customize these
building blocks to fit your needs.

To do that, Bokeh combines two elements:

* A Python library for defining the content and interactive functionalities of
  your visualization.
* A JavaScript library called BokehJS that is working in the background to
  display your interactive visualizations in a web browser.

Based on your Python code, Bokeh automatically generates all the necessary
JavaScript and HTML code for you. In its default setting, Bokeh automatically
loads any additional JavaScript code from Bokeh's CDN (content delivery
network).

.. _first_steps_1_line_chart:

Creating a simple line chart
----------------------------

Your first visualization will be a plot with a single line that looks like
this:

.. bokeh-plot:: docs/first_steps/examples/first_steps_1_simple_line.py
    :source-position: none

Even a simple graph like this has interactive features. Use the tools on the
right of the plot to explore:

* |pan_tool| Use the **pan tool** to move the graph within your plot.
* |box_zoom| Use the **box zoom tool** to zoom into an area of your plot.
* |wheel_zoom| Use the **wheel zoom tool** to zoom in and out with a mouse wheel.
* |save_tool| Use the **save tool** to export the current view of your plot as a PNG
  file.
* |reset| Use the **reset tool** to return your view to the plot's default settings.
* |help| Use the **help symbol** to learn more about the tools available in Bokeh.

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

.. literalinclude:: examples/first_steps_1_simple_line.py
   :language: python

Combining multiple graphs
-------------------------

With Bokeh's |bokeh.plotting| interface, you can add more glyphs to your plot:

.. bokeh-plot:: docs/first_steps/examples/first_steps_1_multiple_lines.py
    :source-position: none

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

.. literalinclude:: examples/first_steps_1_multiple_lines.py
   :language: python

Recap: building visualizations
------------------------------

You just completed all the basic steps that most visualizations with Bokeh's
|bokeh.plotting| interface require:

1. Preparing the data
    You just used a plain Python list, but NumPy arrays or Pandas series also
    work.

2. Telling Bokeh what to do with the generated output
    You used |output_file| with a filename to safe to a file. Another option
    is to use |output_notebook| to display your visualization directly in a
    Jupyter notebook.

3. Calling the |figure| function
    This creates a plot with the most common default options. You
    can customize various properties of your plot, such as its title, tools,
    and axes labels.

4. Adding renderers
    You just used |Figure.line| to create a line. Renderers have various
    options which allow you to specify visual attributes such as colors,
    legends, and widths.

5. Asking Bokeh to |show| or |save| the results
    These functions either save your plot to an HTML file or display it in a
    browser.

.. panels::
    :column: col-lg-12 col-md-12 col-sm-12 col-xs-12 p-2

    ---
    :card: + text-right
    .. link-button:: first_steps_2.html
        :text: Next
        :classes: stretched-link

.. |pan_tool| image:: /_images/icons/Pan.png
    :alt: Icon representing the pan tool
    :height: 19px
.. |box_zoom| image:: /_images/icons/BoxZoom.png
    :alt: Icon representing box zoom
    :height: 19px
.. |wheel_zoom| image:: /_images/icons/WheelZoom.png
    :height: 19px
    :alt: Icon representing the wheel zoom
.. |save_tool| image:: /_images/icons/Save.png
    :height: 19px
    :alt: Icon representing the save tool
.. |reset| image:: /_images/icons/Reset.png
    :height: 19px
    :alt: Icon representing the reset tool
.. |help| image:: /_images/icons/Help.png
    :height: 19px
    :alt: Help symbol

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <userguide_plotting>`
.. |Figure.line|     replace:: :func:`~bokeh.plotting.Figure.line`
.. |figure| replace:: :func:`~bokeh.plotting.figure`
.. |output_file|     replace:: :func:`~bokeh.io.output_file`
.. |output_notebook| replace:: :func:`~bokeh.io.output_notebook`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`
