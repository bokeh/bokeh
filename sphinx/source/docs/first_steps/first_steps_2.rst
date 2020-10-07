.. _first_steps_2:

First steps 2: exploring renderers
==================================

In the :ref:`previous tutorial <quickstart_tutorial1>`, you used Bokeh's
:func:`~bokeh.plotting.figure` function to render line charts.

In this tutorial, you will use different renderers to create various other
kinds of graphs. You will also use customize what your graphs look like.

Rendering various glyphs
------------------------

Bokeh's :ref:`bokeh.plotting <userguide_plotting>` interface supports a number
of glyphs, such as lines, bars, hex tiles, or other polygons.

A full list of all supported glyph methods is available in Bokeh's reference
guide for the :func:`~bokeh.plotting.figure` function. For a detailed
information on Bokeh's glyphs, see :ref:`userguide_plotting` in Bokeh's user
guide.

Rendering circles
^^^^^^^^^^^^^^^^^

Use the :func:`~bokeh.plotting.Figure.circle` function instead of
:func:`~bokeh.plotting.Figure.line` to render circles:

.. code-block:: python

    p.circle(x, y3, legend_label="Objects", line_color="yellow", size=12)

Add the :func:`~bokeh.plotting.Figure.circle` function to your previous
visualization:

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
    p = figure(title="Multiple glyphs example", x_axis_label='x', y_axis_label='y')

    # add multiple renderers
    p.line(x, y1, legend_label="Temp.", line_color="blue", line_width=2)
    p.line(x, y2, legend_label="Rate", line_color="red", line_width=2)
    p.circle(x, y3, legend_label="Objects", line_color="yellow", size=12)

    # show the results
    show(p)

Rendering bars
^^^^^^^^^^^^^^

Similarly, use the :func:`~bokeh.plotting.Figure.vbar` function to render
vertical bars:

.. code-block:: python

    p.vbar(x=x, top=y2, legend_label="Rate", width=0.5, bottom=0, color="red")

Add the :func:`~bokeh.plotting.Figure.vbar` function to your previous
visualization:

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
    p = figure(title="Multiple glyphs example", x_axis_label='x', y_axis_label='y')

    # add multiple renderers
    p.line(x, y1, legend_label="Temp.", line_color="blue", line_width=2)
    p.vbar(x=x, top=y2, legend_label="Rate", width=0.5, bottom=0, color="red")
    p.circle(x, y3, legend_label="Objects", line_color="yellow", size=12)

    # show the results
    show(p)

Customizing glyphs
------------------

The different renderer functions accept different arguments to control what
your glyphs look like.

[TBD: Example with line function!]

The :func:`~bokeh.plotting.Figure.circle` function, for example, lets you
define aspects like the color or diameter of the circles:

* ``fill_color``: the fill color of the circles
* ``fill_alpha``: the transparency of the fill color
* ``line_color``: the fill color of the circles' outlines
* ``size``: the size of the circles (in screen space units)
* ``legend_label``: legend entry for the circles

Create circles with the legend label "Objects" and make the circles appear
slightly transparent with a red fill color and blue outlines:

.. code-block:: python

    p.circle(x, y3, legend_label="Objects", fill_color="red", fill_alpha=0.2, line_color="blue", size=12)

Use this renderer in your previous visualization:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    # prepare some data
    x = [1, 2, 3, 4, 5]
    y = [4, 5, 5, 7, 2]

    # set output to static HTML file
    output_file("lines.html")

    # create a new plot with a title and axis labels
    p = figure(title="Glyphs properties example", x_axis_label='x', y_axis_label='y')

    # add circle renderer
    p.circle(x, y, legend_label="Objects", fill_color="red", fill_alpha=0.2, line_color="blue", size=12)

    # show the results
    show(p)

