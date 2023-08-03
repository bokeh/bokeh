.. _first_steps_1:

First steps 1: Creating a line chart
====================================

With just a few lines of Python code, Bokeh enables you to create
interactive, JavaScript-powered visualizations displayable in a web browser.

The basic idea of Bokeh is a two-step process: First, you select from Bokeh's
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

Bokeh's documentation consists of several elements, including the
|user guide| with detailed explanations and examples and the |reference guide|
that systematically describes every element of Bokeh. In this guide, you will
find links to both those resources.

.. _first_steps_1_line_chart:

.. note::

    All the code in "First Steps" sections can be be run as standard Python scripts.
    When run, these scripts will create HTML outputs that are visible in a web browser.

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
* |wheel_zoom| Use the **wheel zoom tool** to zoom in and out with a mouse
  wheel.
* |save_tool| Use the **save tool** to export the current view of your plot as a
  PNG file.
* |reset| Use the **reset tool** to return your view to the plot's default
  settings.
* |help| Use the **help symbol** to learn more about the tools available in
  Bokeh.

Follow these steps to recreate this simple line chart:

1. Create a new Python file on your machine (e.g. ``simple_line_chart.py``) and open
   it in a code editor of your choice (such as `Sublime Text`_, `Visual Studio Code`_ , etc.).

.. _Sublime Text: https://www.sublimetext.com/
.. _Visual Studio Code: https://code.visualstudio.com/

2. As the first line of your new Python script, import the necessary functions from the |bokeh.plotting| module:

   .. code-block:: python

       from bokeh.plotting import figure, show

3. Define two lists containing the data for your line chart:

   .. code-block:: python

       # prepare some data
       x = [1, 2, 3, 4, 5]
       y = [6, 7, 2, 4, 5]

4. Use the |figure| function to create your plot. Pass the following arguments:

   * ``title``: the title of your line chart (optional)
   * ``x_axis_label``: a text label to put on the chart's x-axis (optional)
   * ``y_axis_label``: a text label to put on the chart's y-axis (optional)

   .. code-block:: python

       # create a new plot with a title and axis labels
       p = figure(title="Simple line example", x_axis_label='x', y_axis_label='y')

5. Add a line graph to the plot you just created, using the
   :func:`~bokeh.plotting.figure.line` function. Pass the following arguments:

   * your lists ``x`` and ``y`` containing the data
   * ``legend_label``: a string to label the line graph with (optional)
   * ``line_width``: define the line width (in pixels, optional)

   .. code-block:: python

       # add a line renderer with legend and line thickness to the plot
       p.line(x, y, legend_label="Temp.", line_width=2)

6. Finally, use the |show| function to generate your graph and
   open a web browser to display the generated HTML file.

   .. code-block:: python

       # show the results
       show(p)

7. From the command line, run the Python script you just created. For example:

   .. code-block:: sh

       python simple_line_chart.py

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
:func:`~bokeh.plotting.figure.line` function multiple times.

First, add more data as the basis for additional graphs:

.. code-block:: python

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y1 = [6, 7, 2, 4, 5]
    y2 = [2, 3, 4, 5, 6]
    y3 = [4, 5, 5, 7, 2]

Next, update the title for your plot by changing the string for the ``title``
argument in the |figure| function:

.. code-block:: python

    # create a new plot with a title and axis labels
    p = figure(title="Multiple line example", x_axis_label='x', y_axis_label='y')

Finally, add more calls to the |figure.line| function:

.. code-block:: python

    # add multiple renderers
    p.line(x, y1, legend_label="Temp.", color="blue", line_width=2)
    p.line(x, y2, legend_label="Rate", color="red", line_width=2)
    p.line(x, y3, legend_label="Objects", color="green", line_width=2)

In this example, you also assign a different color to each of the lines by
passing a different :ref:`named color <ug_styling_colors>` to each line's
``color`` argument.

This is what the completed code for your multi-line plot should look like:

.. literalinclude:: examples/first_steps_1_multiple_lines.py
   :language: python

Recap: building visualizations
------------------------------

You just completed all the basic steps that most basic visualizations with
Bokeh's |bokeh.plotting| interface require:

1. Preparing the data
    You used a plain Python list, but other forms of serialized data work
    as well.

2. Calling the |figure| function
    This creates a plot with the most common default options. You can customize
    various properties of your plot, such as its title, tools, and axes labels.

3. Adding renderers
    You used |figure.line| to create a line. Renderers have various options
    that allow you to specify visual attributes such as colors, legends, and
    widths.

4. Asking Bokeh to |show| or |save| the results
    These functions either save your plot to an HTML file or display it in a
    browser.

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

.. |figure.line|     replace:: :func:`~bokeh.plotting.figure.line`
