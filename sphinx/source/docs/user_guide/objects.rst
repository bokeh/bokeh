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
  - "title" is also the prefix for a set of :ref:`userguide_objects_text_properties`, so you can set the font for the title with the parameter ``title_text_font``.

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

.. include:: ../includes/line_props.txt


.. _userguide_objects_fill_properties:

Fill Properties
***************

.. include:: ../includes/fill_props.txt


.. _userguide_objects_text_properties:

Text Properties
***************

.. include:: ../includes/text_props.txt

.. _userguide_objects_ranges:

Ranges
------

To control the ranges that Bokeh plots show, there are two keyword parameters
`x_range` and `y_range`. These may be passed into the :class:`bokeh.plotting.figure`
function, or they may also be set as attributes on a plot object.

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
You can also pass a :class:`bokeh.models.Range1D` object explicitly::

    figure(xrange=Range1d(start=2, end=8))

This will prepare a new plot that has an x-axis range that spans the interval `[2, 8]`.
Alternatively, you can set the range as a property on a Plot object::

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
* **location**: where should labels and ticks be located in relation to the axis rule: ``"auto", "left", "right", "above", "below"``
* **bounds**: bounds for the axis, either ``"auto"`` or a 2-tuple of ``(start, stop)``
* **axis_label_standoff**: a number of pixels to stand tick labels away from ticks
* **major_label_standoff**: a number of pixels to stand axis labels away from tick labels
* **major_label_orientation**: the angle that major tick labels should be rendered at, one of ``"horizontal", "vertical", "normal", "parallel"`` or a floating point angle (in radians)
* **major_tick_in** a distance in pixels that major ticks should extend into the plot area
* **major_tick_out** a distance in pixels that major ticks should extend out the plot area

Some examples::

    ax.axis_line_color = "red"
    ax.bounds = (3, 7)
    ax.major_label_orientation = pi/4

Axes for a plot may be conveniently obtained using the ``xaxis``, ``yaxis``,
and ``axis`` properties. These return collections of axes that can be
indexed to retrieve individual axes, or can that have attributes set
directly on them to update all axes. Examples::

    p.xaxis.axis_line_width = 2 # update all x-axes
    p.yaxis[0].axis_line_color = "red" # only updates the first y-axis
    p.axis.bounds = (2, 8) # set bounds for all axes

Typically after updating these attributes, a call to :func:`bokeh.plotting.show` will be required.

.. note::
    The ``bounds`` attribute here controls only the extent of the axis! It does
    not set the range of the plot. For that, see :ref:`userguide_objects_ranges`.
    As an example, a plot window may extend from 0 to 10, but you may only want
    the axis to render between 4 and 8, in order to highlight a particular
    sub-area of the plot.

.. _userguide_objects_grids:

Grids
'''''

Grids for a plot may be conveniently obtained using the ``xgrid``, ``ygrid``,
and ``grid`` properties. These return collections of axes that can be
indexed to retrieve individual grids, or can that have attributes set
directly on them to update all axes. Examples::

    p.xgrid.axis_line_dash = "3 3" # update all x-grids
    p.ygrid[0].axis_line_color = None # only updates the first y-grid
    p.grid.bounds = (2, 8) # set bounds for all grids

Typically after updating these attributes, a call to :func:`bokeh.plotting.show` will be required.

.. note::
    The ``bounds`` attribute here controls only the extent of the grid! It does
    not set the range of the plot. For that, see :ref:`userguide_objects_ranges`.
    As an example, a plot window may extend from 0 to 10, but you may only want
    the grid to render between 4 and 8, in order to highlight a particular
    sub-area of the plot.


.. _userguide_objects_legends:

Legends
'''''''


Tools
-----

Bokeh comes with a number of interactive tools. There are five categories of tool
interactions:

* Pan/Drag
* Click/Tap
* Scroll/Pinch
* Actions
* Inspectors

For the first three categories, one tool can be active at any given time, and
the active tool is indicated on the toolbar by a highlight next to to the tool.
Actions are immediate or modal operations that are only activated when their
button in the toolbar is pressed. Inspectors are passive tools that merely
report information or annotate the plot in some way.

When using the :ref:`userguide_plotting` interface, tools are added to plots with the
``tools`` keyword argument, which has as its value a comma separated string
listing the tools to add to the plot, for example::

    tools = "pan,wheel_zoom,box_zoom,reset,resize"

Pan/Drag Tools
''''''''''''''

These tools are employed by panning (on touch devices) or left-dragging (on
mouse devices). Only one pan/drag tool may be active at a time.

BoxSelectTool
*************

* name: ``'box_select'``
* icon: |box_select_icon|

The box selection tool allows the user to define a rectangular selection
region by left-dragging a mouse, or dragging a finger across the plot area.
The box select tool may be configured to select across only one dimension by
setting the ``dimension`` property to ``width`` or ``height``.

.. note::
    To make a multiple selection, you have to press the SHIFT key and
    to clear the selection you have to press ESC key.

BoxZoomTool
***********

* name: ``'box_zoom'``
* icon: |box_zoom_icon|

The box zoom tool allows the user to degine a rectangular region to zoom the
plot bounds too, by left-dragging a mouse, or dragging a finger across the
plot area.

LassoSelectTool
***************

* name: ``'lasso_select'``
* icon: |lasso_select_icon|

The lasso selection tool allows the user to define an arbitrary region for
selection by left-dragging a mouse, or dragging a finger across the plot area.

.. note::
    To make a multiple selection, you have to press the SHIFT key and
    to clear the selection you have to press ESC key.

PanTool
*******

* name: ``'pan'``
* icon: |pan_icon|

The pan tool allows the user to pan the plot by left-dragging a mouse or dragging a
finger across the plot region.

It is also possible to constraint the pan tool to only act on either just the x-axis or
just the y-axis by setting the ``dimension`` property to ``width`` or ``height``.
Additionally, there are tool aliases ``'xpan'`` and ``'ypan'``, respectively.

ResizeTool
**********

* name: ``'resize_select'``
* icon: |resize_icon|

The resize tool allows the user to left-drag a mouse or drag a finger to resize
the entire plot.

Click/Tap Tools
'''''''''''''''

These tools are employed by tapping (on touch devices) or left-clicking (on
mouse devices). Only one click/tap tool may be active at a time.

PolySelectTool
**************

* name: ``'poly_select'``
* icon: |poly_select_icon|

The polygon selection tool allows the user to define an arbitrary polygonal
regions for selection by left-clicking a mouse, or tapping a finger at different
locations.

.. note::
    To complete the selection, you have to make a double left-click or tapping
    Also, to make a multiple selection, you have to press the SHIFT key and
    to clear the selection you have to press ESC key.

TapSelectTool
*************

* name: ``'tap_select'``
* icon: |tap_select_icon|

The tap selection tool allows the user to select at single points by clicking
a left mouse button, or tapping with a finger.

.. note::
    To make a multiple selection, you have to press the SHIFT key and
    to clear the selection you have to press ESC key.

Scroll/Pinch Tools
''''''''''''''''''

These tools are employed by pinching (on touch devices) or scrolling (on
mouse devices). Only one scroll/pinch tool may be active at a time.

WheelZoomTool
*************

* name: ``'wheel_zoom'``
* icon: |wheel_zoom_icon|

The wheel zoom tool will zoom the plot in and out, centered on the curren
t mouse location.

It is also possible to constraint the wheel zoom tool to only act on either
just the x-axis or just the y-axis by setting the ``dimension`` property to
``width`` or ``height``. Additionally, there are tool aliases ``'xwheel_zoom'``
and ``'ywheel_zoom'``, respectively.

Actions
'''''''

Actions are operations that are activated only when their button in the toolbar
is tapped or clicked. They are typically modal or immediate-acting.

ResetTool
*********

* name: ``'reset'``
* icon: |reset_icon|

The reset tool will restore the plot ranges to their original values.

SaveTool
********

* name: ``'save'``
* icon: |save_icon|

The save tool pops up a modal dialog that allows the user to save a PNG image
of the plot.

Inspectors
''''''''''

* menu icon: |inspector_icon|

Inpectors are passive tools that annotate or otherwise report information about
the plot, based on the current cursor position. Any number of inspectors may be
active at any given time. The inspectors menu in the toolbar allows users to
toggle the active state of any inspector.

CrosshairTool
*************

* name: ``'crosshair'``

Th crosshair tool draws a crosshair annotation over the plot, centered on
the current mouse position. The crosshair tool may be configured to draw
accross only one dimension by setting the ``dimension`` property to
``width`` or ``height``.

HoverTool
*********

* name: ``'hover'``

The hover tool pops up a tooltip div whenever the cursor is over a glyph.
The information comes from the glyphs data source and is configurable through
a simple tooltips dictionary that maps displayed names to columns in the data source,
or to special known variables. Here is an example of how to configure the hover tool::

    # We want to add some fields for the hover tool to interrogate, but first we
    # have to get ahold of the tool. We can use the 'select' method for that.
    hover = plot.select(dict(type=HoverTool))

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


.. |box_select_icon| image:: /_images/icons/BoxSelect.png
    :height: 14pt
.. |box_zoom_icon| image:: /_images/icons/BoxZoom.png
    :height: 14pt
.. |help_icon| image:: /_images/icons/Help.png
    :height: 14pt
.. |inspector_icon| image:: /_images/icons/Inspector.png
    :height: 14pt
.. |lasso_select_icon| image:: /_images/icons/LassoSelect.png
    :height: 14pt
.. |pan_icon| image:: /_images/icons/Pan.png
    :height: 14pt
.. |poly_select_icon| image:: /_images/icons/PolygonSelect.png
    :height: 14pt
.. |reset_icon| image:: /_images/icons/Reset.png
    :height: 14pt
.. |resize_icon| image:: /_images/icons/Resize.png
    :height: 14pt
.. |save_icon| image:: /_images/icons/Save.png
    :height: 14pt
.. |tap_select_icon| image:: /_images/icons/TapSelect.png
    :height: 14pt
.. |wheel_zoom_icon| image:: /_images/icons/WheelZoom.png
    :height: 14pt

