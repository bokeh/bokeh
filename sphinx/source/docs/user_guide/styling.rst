.. _userguide_styling:

Styling Visual Attributes
=========================

.. contents::
    :local:
    :depth: 3

.. _userguide_styling_colors:

Specifying Colors
-----------------

Colors properties are used in many places in Bokeh, to specify the colors to
use for lines, fills or text. Color values can be provided in any of the
following ways:

.. include:: ../includes/colors.txt

.. _userguide_styling_visual_properties:

Visual Properties
-----------------

In order to style the visual attributes of Bokeh plots, you first must
know what the available properties are. The full :ref:`refguide` will
list all the properties of every object individually, though there are three
broad groups of properties that show up often. They are:

* **line properties** line color, width, etc.
* **fill properties** fill color, alpha, etc.
* **text properties** font styles, colors, etc.

Below is more detail about each of these.

.. _userguide_styling_line_properties:

Line Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/line_props.txt

.. _userguide_styling_fill_properties:

Fill Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/fill_props.txt

.. _userguide_styling_text_properties:

Text Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/text_props.txt

.. _userguide_styling_selecting:

Selecting Plot Objects
----------------------

.. _userguide_styling_plots:

Plots
-----

.. _userguide_styling_plot_dimensions:

Dimensions
~~~~~~~~~~

The dimensions (width and height) of a |Plot| are controlled by ``plot_width``
and ``plot_height`` attributes. These values are in screen units, and they
control the size of the entire canvas area, including any axes or titles (but
not the toolbar). If you are using the |bokeh.plotting| or |bokeh.charts|
interfaces, then these values can be passed to |figure| or the Chart function
as a convenience:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("dimensions.html")

    # create a new plot with a title
    p = figure(plot_width=700)
    p.plot_height=300

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_plot_title:

Title
~~~~~

The styling of the title of the plot is controlled by a set of `Text Properties`_
on the |Plot|, that are prefixed with ``title_``. For instance, to set the color
of the outline, use ``title_text_color``:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("title.html")

    # create a new plot with a title
    p = figure(plot_width=400, plot_height=400, title="Some Title")
    p.title_text_color = "olive"
    p.title_text_font = "times"
    p.title_text_font_style = "italic"

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_plot_background:

Background
~~~~~~~~~~

The background fill color is controlled by the ``background_fill`` property
of the |Plot| object:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("background.html")

    # create a new plot with a title
    p = figure(plot_width=400, plot_height=400)
    p.background_fill = "beige"

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_plot_border:

Border
~~~~~~

The border fill color is controlled by the ``border_fill`` property
of the |Plot| object. You can also set the minimum border on each side
(in screen units) with the properties

``min_border_left``

``min_border_right``

``min_border_top``

``min_border_bottom``

Additionally, setting ``min_border`` will apply a minimum border setting
to all sides as a convenience.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("border.html")

    # create a new plot with a title
    p = figure(plot_width=400, plot_height=400)
    p.border_fill = "whitesmoke"
    p.min_border_left = 80

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_styling_plot_outline:

Outline
~~~~~~~

.. _userguide_styling_glyphs:

The styling of the outline of the plotting area is controlled by a set of
`Line Properties`_ on the |Plot|, that are prefixed with ``outline_``. For
instance, to set the color of the outline, use ``outline_line_color``:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("outline.html")

    # create a new plot with a title
    p = figure(plot_width=400, plot_height=400)
    p.outline_line_width = 7
    p.outline_line_alpha = 0.3
    p.outline_line_color = "navy"

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

Glyphs
------

.. _userguide_styling_axes:

Axes
----

In this section you will learn how to change various visual properties
of Bokeh plot axes.

The easiest way to get ahold of Axis objects, so that you can set
style attributes on them, is to use the |xaxis|, |yaxis|, and |axis|
methods on a plot:

.. code-block:: python

    >>> p.xaxis
    [<bokeh.models.axes.LinearAxis at 0x106fa2390>]

This returns a list of Axis objects (since there may be more than
one). But note that, as convenience, these lists are *splattable*,
meaning that you can set attributes directly on this result, and
the attributes will be applied to all the axes in the list:

.. code-block:: python

    p.xaxis.axis_label = "Temperature"

will change the value of ``axis_label`` for every x-axis (however
many there may be).

Below is code that will set some of the properties of axes. You can
execute this code, and try setting other properties as well.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("axes.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-axes
    p.xaxis.axis_label = "Temp"
    p.xaxis.axis_line_width = 3
    p.xaxis.axis_line_color = "red"

    # change just some things about the y-axes
    p.yaxis.axis_label = "Pressure"
    p.yaxis.major_label_text_color = "orange"
    p.yaxis.major_label_orientation = "vertical"

    # change things on all axes
    p.axis.minor_tick_in = -3
    p.axis.minor_tick_out = 6

    show(p)

.. _userguide_styling_axes_labels:

Labels
~~~~~~

The text of an overall label for an axis is controlled by the ``axis_label``
property. Additionally, there are `Text Properties`_ prefixed with
``axis_label_`` that control the visual appearance of the label. For instance
to set the color of the label, set ``axis_label_text_color``. Finally, to
change the distance between the axis label and the major tick labels, set
the ``axis_label_standoff`` property:

.. bokeh-plot::
    :source-position: above

    from bokeh.models.ranges import Range1d
    from bokeh.plotting import figure, output_file, show

    output_file("bounds.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis.axis_label = "Lot Number"
    p.xaxis.axis_label_text_color = "#aa6666"
    p.xaxis.axis_label_standoff = 30

    p.yaxis.axis_label = "Bin Count"
    p.yaxis.axis_label_text_font_style = "italic"

    show(p)


.. _userguide_styling_axes_bounds:

Bounds
~~~~~~

Sometimes it is useful to limit the bounds where axes are drawn. This can be
accomplished by setting the ``bounds`` property of an axis object to a 2-tuple
of *(start, end)*:

.. bokeh-plot::
    :source-position: above

    from bokeh.models.ranges import Range1d
    from bokeh.plotting import figure, output_file, show

    output_file("bounds.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis.bounds = (2, 4)

    show(p)

.. _userguide_styling_axes_tick_lines:

Tick Lines
~~~~~~~~~~

The visual appearance of the major and minor ticks is controlled by
a collection of `Line Properties`_, prefixed with ``major_tick_`` and
``minor_tick_``, respectively. For instance, to set the color of the
major ticks, use ``major_tick_line_color``. To hide either set of ticks,
set the color to ``None``. Additionally, you can control how far in and
out of the plotting area the ticks extend, with the properties
``major_tick_in``/``major_tick_out`` and ``minor_tick_in``/``minor_tick_out``.
These values are in screen units, and negative values are acceptable.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("axes.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    p.xaxis.major_tick_line_color = "firebrick"
    p.xaxis.major_tick_line_width = 3
    p.xaxis.minor_tick_line_color = "orange"

    p.yaxis.minor_tick_line_color = None

    p.axis.major_tick_out = 10
    p.axis.minor_tick_in = -3
    p.axis.minor_tick_out = 8

    show(p)


.. _userguide_styling_axes_tick_labels:

Tick Labels
~~~~~~~~~~~


Now we have seen that various line and text properties of plot axes
can be easily set by using the |xaxis|, |yaxis| and |axis| properties
of plots.

There are many more properties that Bokeh axes support configuring.
For a complete listing of all the various attributes that can be set
on different types of Bokeh axes, consult the :ref:`bokeh.models.axes`
section of of the :ref:`refguide`.

.. _userguide_styling_grids:

Grids
-----

In this section you will learn how to set the visual properties of grid
lines and grid bands on Bokeh plots.

Similar to the convenience methods for axes, there are |xgrid|, |ygrid|,
and |grid| methods on plots that can be used to get ahold of the grid
objects:

.. code-block:: python

    >>> p.grid
    [<bokeh.models.grids.Grid at 0x106fa2278>,
     <bokeh.models.grids.Grid at 0x106fa22e8>]

These methods also return splattable lists, so that you can set attributes
on the list, as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.grid.line_dash = [4 2]

.. note::
    The ``xgrid`` property provides the grid objects that *intersect* the
    x-axis (i.e., are vertical). Correspondingly, ``ygrid`` provides
    the grid objects that intersect the y-axis (i.e., are horizontal).

.. _userguide_styling_grid_lines:

Lines
~~~~~

Below is code that will set some of the properties of grid lines. You can
execute this code, and try setting other properties as well.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("gridlines.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-grid
    p.xgrid.grid_line_color = None

    # change just some things about the y-grid
    p.ygrid.grid_line_alpha = 0.5
    p.ygrid.grid_line_dash = [6, 4]

    show(p)

.. _userguide_styling_grid_bands:

Bands
~~~~~

It is also possible to display filled, shaded bands between adjacent
grid lines. Below is code that will set some of the fill properties of
grids bands. You can execute this code, and try setting different values.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("gridbands.html")

    p = figure(plot_width=400, plot_height=400, title=None)
    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    # change just some things about the x-grid
    p.xgrid.grid_line_color = None

    # change just some things about the y-grid
    p.ygrid.band_fill_alpha = 0.1
    p.ygrid.band_fill_color = "navy"

    show(p)


Now we have seen that various line properties of plot grids can be easily
set by using the |xgrid|, |ygrid| and |grid| properties of plots.

There are other properties that Bokeh grids support configuring.
For a complete listing of all the various attributes that can be set
on Bokeh plot grids, consult the :ref:`bokeh.models.grids` section of the
:ref:`refguide`.

.. _userguide_styling_legends:

Legends
-------



.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Range1d| replace:: :class:`~bokeh.models.ranges.Range1d`


.. |legend| replace:: :class:`~bokeh.plotting.Figure.legend`
.. |grid|   replace:: :class:`~bokeh.plotting.Figure.grid`
.. |xgrid|  replace:: :class:`~bokeh.plotting.Figure.xgrid`
.. |ygrid|  replace:: :class:`~bokeh.plotting.Figure.ygrid`
.. |axis|   replace:: :class:`~bokeh.plotting.Figure.axis`
.. |xaxis|  replace:: :class:`~bokeh.plotting.Figure.xaxis`
.. |yaxis|  replace:: :class:`~bokeh.plotting.Figure.yaxis`
