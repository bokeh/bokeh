.. _userguide_objects:

Bokeh Objects
=============

.. contents::
    :local:
    :depth: 2

.. _userguide_objects_plots:

Plots
-----

Plots can be configured with several keyword arguments that control appearance:

* ``background_fill`` --- a color to fill the inner plot area with

* ``border_fill`` --- a color to fill the border region around the plot area with.

* ``min_border`` --- a minimum size in pixels for the border. This applies to all sides of the plot. May set individual border widths with ``min_border_left``, ``min_border_right``, ``min_border_top``, and ``min_border_bottom``

* ``h_symmetry``, ``v_symmetry`` --- whether to symmetrize plot borders on opposite horizontal or vertical sides of the plot.

* ``title`` --- a title to display above the plot.
  - "title" is also the prefix for a set of :ref:`userguide_objects_text_properties`, so you can set the font for the title with the parameter ``text_font``.

* "outline" --- is the prefix for a set of :ref:`userguide_objects_line_properties` that control the appearance of an outline around the plot, for instance you can set the color of the outline with ``outline_line_color``.

* ``x_range`` --- the extent of the plotting area in the x-dimension. See :ref:`userguide_objects_ranges`

* ``y_range`` --- the extent of the plotting area in the y-dimension. See :ref:`userguide_objects_ranges`

* ``plot_width``, ``plot_height`` --- width and height of the entire plot in pixels, including border space

* ``x_axis_type``, ``y_axis_type`` --- can be set to ``"datetime"`` to create datetime axis

* ``x_mapper_type``, ``y_mapper_type`` --- can be set to ``"log"`` to specifically set the mapper used for the axis

These parameters can be passed to glyph functions such a ``circle`` or ``rect`` but it is often useful
to pass them to a call to ``figure``::

    figure(
        title="My Plot",
        title_text_font_size="20pt",
        plot_width=200,
        plot_height=300,
        outline_line_color="red",
        x_axis_type="datetime"
    )

.. _userguide_objects_glyphs:

Glyphs
------

Bokeh plots are centered around glyphs, which generally have some combination of line, fill, or
text properties, depending on what is appropriate for a given glyph. For example, the ``Circle``
glyph has both line and fill properties, but the ``Bezier`` glyph only has line properties.
These properties may be specified as keyword arguments when calling the glyph functions::

    rect(x, y, radius, fill_color="green", fill_alpha=0.6, line_color=None)

.. _userguide_objects_markers:

Markers
'''''''

Markers are a subset of Bokeh glyphs that have a prescribed interface.
Markers all respond to:

* `x`, `y`
* `size` (screen units)
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _userguide_objects_styling:

Styling
-------

Properties
''''''''''
Many of the styling options are grouped into three categories of properties: :ref:`userguide_objects_line_properties`,
:ref:`userguide_objects_fill_properties`, and :ref:`userguide_objects_text_properties`.

.. _userguide_objects_line_properties:

Line Properties
***************

.. include:: includes/line_props.txt


.. _userguide_objects_fill_properties:

Fill Properties
***************

.. include:: includes/fill_props.txt


.. _userguide_objects_text_properties:

Text Properties
***************

.. include:: includes/text_props.txt

.. _userguide_objects_ranges:

Ranges
------

To control the ranges that Bokeh plots show, there are two keyword parameters `x_range` and
`y_range`. These may be passed into the :class:`bokeh.plotting.figure` function, or into any
of the high-level plotting :ref:`bokeh_plotting_glyphs`. They may also be set as attributes on
a plot object.

Automatic Ranges
''''''''''''''''

If `None` is passed in as the value of `x_range` or `y_range`, then the plot will be configured
with a `DataRange1d` which computes the envelope of all the plot data to determine the range.
This is the default behavior.

.. note::
    For non-scatter glyphs with spatial extent, the `DataRange1d` may not
    compute the necessary bounds fully.

Numerical Ranges
''''''''''''''''

To set the range on a plot that has numerical range values, you can pass a sequence of
numbers with length two::

    figure(xrange=[0, 100])

This will prepare a new plot that has an x-axis range that spans the interval `[0, 100]`.
You can also pass a :class:`bokeh.objects.Range1D` object explicitly::

    figure(xrange=Range1d(start=2, end=8))

This will prepare a new plot that has an x-axis range that spans the interval `[2, 8]`.
Alternatively, you can set the range as a property on a Plot object::

    plot = curplot()
    plot.y_range = Range1d(start=0, end=10)

Categorical Ranges
''''''''''''''''''

For plots with categorical ranges, it is necessary to specify the range as a sequence
of strings that give the categories in the desired order. For example::

    figure(y_range=["foo", "bar", "baz"])

will prepare a plot whose y-axis range is categorical, with the categories "foo",
"bar", and "baz". Please see `this categorical example <http://bokeh.pydata.org/docs/gallery/categorical.html>`_
from the gallery for a concrete example.

You can also pass in a `FactorRange` explicitly as well.

.. _userguide_objects_guides:

Guides
------

.. _userguide_objects_axes:

Axes
''''

Axes in Bokeh also have line properties for the axis rule line, as well as for the major ticks. These standard
line properties are prefixed with ``axis_`` and ``major_tick_`` respectively. Axes also have text
properties, for the axis label and major tick labels. These are prefixed ``axis_label_`` and
``major_tick_label_``, respectively.

* **dimension**: currently ``0`` or ``1``, corresponding to "x" or "y" axis
* **location**: where along the cross-dimension to locate this axis: ``"min", "max", "left", "right", "top", "bottom"`` or a floating point value
* **bounds**: bounds for the axis, either ``"auto"`` or a 2-tuple of ``(start, stop)``
* **axis_label_standoff**: a number of pixels to stand tick labels away from ticks
* **major_label_standoff**: a number of pixels to stand axis labels away from tick labels
* **major_label_orientation**: the angle that major tick labels should be rendered at, one of ``"horizontal", "vertical", "normal", "parallel"`` or a floating point angle (in radians)
* **major_tick_in** a distance in pixels that major ticks should extend into the plot area
* **major_tick_out** a distance in pixels that major ticks should extend out the plot area

Some examples::

    axis.axis_line_color = "red"
    axis.bounds = (3, 7)
    axis.major_label_orientation = pi/4

Axes for the current plot may be conveniently obtained using the :func:`bokeh.plotting.xaxis`, :func:`bokeh.plotting.yaxis`,
and :func:`bokeh.plotting.axis` functions. These return collections of axes that can be indexed to retrieve
individual axes, or can that have attributes set directly on them to update all axes. Examples::

    xaxis().axis_line_width = 2 # update all x-axes
    yaxis()[0].axis_line_color = "red" # only updates the first y-axis
    axis().bounds = (2, 8) # set bounds for all axes

Typically after updating these attributes, a call to :func:`bokeh.plotting.show` will be required.

.. note:: The ``bounds`` attribute here controls only the extent of the axis! It does not set the range of the plot. For that, see :ref:`userguide_objects_ranges`. As an example, a plot window may extend from 0 to 10, but you may only want the axis to render between 4 and 8, in order to highlight a particular sub-area of the plot.

.. _userguide_objects_grids:

Grids
'''''

Grids are styled very similarly to axes in Bokeh. Grids have identical ``dimension`` and ``bounds`` properties
as well as line properties, prefixed with ``grid_``. There are also :func:`bokeh.plotting.xgrid`, :func:`bokeh.plotting.ygrid`,
and :func:`bokeh.plotting.grid` functions available to obtain grids for the current plot. Examples::

    xgrid().axis_line_dash = "3 3" # update all x-grids
    ygrid()[0].axis_line_color = None # only updates the first y-grid
    grid().bounds = (2, 8) # set bounds for all grids

Typically after updating these attributes, a call to :func:`bokeh.plotting.show` will be required.

.. note:: The ``bounds`` attribute here controls only the extent of the grid! It does not set the range of the plot. For that, see :ref:`userguide_objects_ranges`. As an example, a plot window may extend from 0 to 10, but you may only want the grid to render between 4 and 8, in order to highlight a particular sub-area of the plot.


.. _userguide_objects_legends:

Legends
'''''''


Tools
-----

Bokeh comes with a number of interactive tools. The are typically activated
through the toolbar above plots, although some can be activated by key presses
or specific mouse movement.

Tools are added to plots with the ``tools`` keyword argument, which has as its
value a comma separated string listing the tools to add to the plot, for example::

    tools = "pan,wheel_zoom,box_zoom,reset,resize"

BoxSelectTool
'''''''''''''
The box selection tool (``'select'``) allows the user to define a rectangular selection
region be left-dragging on the plot. The indicies of the data points in the selection
region are stored on the data source as the current selection. If other plots share this
datasource, then they will render a linked selection. This selection is also available
from python when using server-based output.

BoxZoomTool
'''''''''''
The box zoom tool (``'box_zoom'``) will zoom the plot in to the box region that a user
selects with left drag while it is the active tool.

CrosshairTool
'''''''''''''
Th crosshair tool (``'crosshair'``) draws a crosshair annotation over the plot, centered on
the current mouse position.

HoverTool
'''''''''
The hover tool (``'hover'``) tool pops up a tooltip div whenever the cursor is over
a glyph. The information comes from the glyphs data source and is configurable through
a simple tooltips dictionary that maps displayed names to columns in the data source,
or to special known variables. Here is an example of how to configure the hover tool::

    # We want to add some fields for the hover tool to interrogate, but first we
    # have to get ahold of the tool. We can use the 'select' method for that.
    hover = curplot().select(dict(type=HoverTool))

    # Add tooltip (name, value) pairs to tooltips. Variables from the data source
    # are available with a "@" prefix, e.g., "@foo" will display the value for
    # the 'foo' column value under the cursor. There are also some special known
    # values that start with "$" symbol:
    #   - $index     index of selected point in the data source
    #   - $x, $y     "data" coordinates under cursor
    #   - $sx, $sy   canvas coordinates under cursor
    #   - $color     color data from data source, syntax: $color[options]:field_name
    #                available options for $color are: hex, swatch
    # NOTE: we use an OrderedDict here to preserve the order in the displayed tooltip
    hover.tooltips = OrderedDict([
        ("index", "$index"),
        ("(x,y)", "($x, $y)"),
        ("radius", "@radius"),
        ("fill color", "$color[hex, swatch]:fill_color"),
        ("foo", "@foo"),
        ("bar", "@bar"),
    ])

.. note::
    Point hit testing is not currently available on all glyphs. Hover tool currently does
    not work with line or image type glyphs.

PanTool
'''''''
The pan tool (``'pan'``) pans the plot on left-click drag. It can be made the active tool
by clicking its button on the tool bar, however it also automatically activates on left-click
drag whenever there is no other active tool.

It is also possible to constraint the pan tool to only act on either just the x-axis or
just the y-axis. For this, there are tool names ``'xpan'`` and ``'ypan'``, respectively.

PreviewSaveTool
'''''''''''''''
The preview-save tool (``'previewsave'``) pops up a modal dialog that allows the user to save
a PNG image if the plot.

ResetTool
'''''''''
The reset tool (``'reset'``) will restore the plot ranges to their original values.

ResizeTool
''''''''''
The resize tool (``'resize'``) allows the user to left drag to resize the entire plot while
it is the active tool.

WheelZoomTool
'''''''''''''
The wheel zoom tool (``'wheel_zoom'``) will zoom the plot in and out, centered on the current
mouse location.  It can be made the active tool by clicking its button on the tool bar, however
it also automatically activates when the ``Shift`` key is depressed.

It is also possible to constraint the wheel zoom tool to only act on either just the x-axis or
just the y-axis. For this, there are tool names ``'xwheel_zoom'`` and ``'ywheel_zoom'``, respectively.



