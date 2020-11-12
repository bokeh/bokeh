.. _userguide_tools:

Configuring Plot Tools
======================

Bokeh comes with a number of interactive tools that can be used to report
information, to change plot parameters such as zoom level or range extents,
or to add, edit, or delete glyphs. Tools can be grouped into four basic
categories:

Gestures
    These are tools that respond to single gestures, such as a pan movement.
    The types of gesture tools are:

    - :ref:`userguide_tools_pandrag`
    - :ref:`userguide_tools_clicktap`
    - :ref:`userguide_tools_scrollpinch`

    For each type of gesture, one tool can be active at any given time, and
    the active tool is indicated on the toolbar by a highlight next to the
    tool icon.

:ref:`userguide_tools_actions`
    These are immediate or modal operations that are only activated when their
    button in the toolbar is pressed, such as the ``ResetTool``.

:ref:`userguide_tools_inspectors`
    These are passive tools that report information or annotate plots in some
    way, such as the ``HoverTool`` or ``CrosshairTool``.

:ref:`userguide_tools_edit`
    These are sophisticated multi-gesture tools that can add, delete, or modify
    glyphs on a plot. Since they may respond to several gestures at once, an
    edit tool will potentially deactivate multiple single-gesture tools at once
    when it is activated.

In addition to information about all the individual tools, this chapter
describes how the toolbar may be configured.

.. _userguide_tools_toolbar:

Positioning the Toolbar
-----------------------

By default, Bokeh plots come with a toolbar above the plot. In this section,
you will learn how to specify a different location for the toolbar, or how to
remove it entirely.

The toolbar location can be specified by passing the ``toolbar_location``
parameter to the |figure| function. Valid values are:

* ``"above"``
* ``"below"``
* ``"left"``
* ``"right"``

If you would like to hide the toolbar entirely, pass ``None``.

Below is some code that positions the toolbar below the plot. Try
running the code and changing the ``toolbar_location`` value.

.. bokeh-plot:: docs/user_guide/examples/tools_position_toolbar_clash.py
    :source-position: above

Note that the toolbar position clashes with the default axes, In this case,
setting the ``toolbar_sticky`` option to ``False`` will move the toolbar
outside of the area where the axis is drawn.

.. bokeh-plot:: docs/user_guide/examples/tools_position_toolbar.py
    :source-position: above

.. _userguide_tools_specifying_tools:

Specifying Tools
----------------

At the lowest ``bokeh.models`` level, tools are added to a ``Plot`` by
passing instances of ``Tool`` objects to the ``add_tools`` method:

.. code-block:: python

    plot = Plot()
    plot.add_tools(LassoSelectTool())
    plot.add_tools(WheelZoomTool())

This explicit way of adding tools works with any Bokeh ``Plot`` or
``Plot`` subclass, such as ``Figure``.

Tools can be specified by passing the ``tools`` parameter to the |figure|
function. The tools parameter accepts a list of tool objects, for instance:

.. code-block:: python

    tools = [BoxZoomTool(), ResetTool()]

Tools can also be supplied conveniently with a comma-separated string
containing tool shortcut names:

.. code-block:: python

    tools = "pan,wheel_zoom,box_zoom,reset"

However, this method does not allow setting properties of the tools.

Finally, it is also always possible to add new tools to a plot by passing
a tool object to the ``add_tools`` method of a plot. This can also be done
in conjunction with the ``tools`` keyword described above:

.. code-block:: python

    from bokeh.models import BoxSelectTool

    plot = figure(tools="pan,wheel_zoom,box_zoom,reset")
    plot.add_tools(BoxSelectTool(dimensions="width"))

.. _userguide_tools_setting_active_tools:

Setting the Active Tools
------------------------

Bokeh toolbars can have (at most) one active tool from each kind of gesture
(drag, scroll, tap). By default, Bokeh will use a default pre-defined
order of preference to choose one of each kind from the set of configured
tools, to be active.

However, it is possible to exert control over which tool is active. At the
lowest ``bokeh.models`` level, this is accomplished by using the ``active_drag``,
``active_inspect``, ``active_scroll``, and ``active_tap`` properties of
``Toolbar``. These properties can take the following values:

* ``None`` --- there is no active tool of this kind
* ``"auto"`` --- Bokeh chooses a tool of this kind to be active (possibly none)
* a ``Tool`` instance --- Bokeh sets the given tool to be the active tool

Additionally, the ``active_inspect`` tool may accept:
* A sequence of ``Tool`` instances to be set as the active tools

As an example:

.. code-block:: python

    # configure so that no drag tools are active
    plot.toolbar.active_drag = None

    # configure so that Bokeh chooses what (if any) scroll tool is active
    plot.toolbar.active_scroll = "auto"

    # configure so that a specific PolySelect tap tool is active
    plot.toolbar.active_tap = poly_select

    # configure so that a sequence of specific inspect tools are active
    # note: this only works for inspect tools
    plot.toolbar.active_inspect = [hover_tool, crosshair_tool]

The default value for all of these properties is ``"auto"``.

Active tools can be specified by passing the these properties as keyword
arguments to the |figure| function. It is also possible to pass any one of
the string names for, ease of configuration:

.. code-block:: python

    # configures the lasso tool to be active
    plot = figure(tools="pan,lasso_select,box_select", active_drag="lasso_select")

.. _userguide_tools_pandrag:

Pan/Drag Tools
--------------

These tools are employed by panning (on touch devices) or left-dragging (on
mouse devices). Only one pan/drag tool may be active at a time. Where
applicable, Pan/Drag tools will respect any max and min values set on ranges.

BoxSelectTool
~~~~~~~~~~~~~

* name: ``'box_select'``
* icon: |box_select_icon|

The box selection tool allows the user to define a rectangular selection
region by left-dragging a mouse, or dragging a finger across the plot area.
The box select tool may be configured to select across only one dimension by
setting the ``dimensions`` property to ``width`` or ``height`` instead of the
default ``both``.

After a selection is made, the indices of the selected points are available
from properties on the |Selection| object for a glyph data source. For example:

.. code-block:: python

    source.selected.indices

will hold the selected indices in the common case of a "scatter" type glyph.

.. note::
    To make a multiple selection, press the SHIFT key. To clear the
    selection, press the ESC key.

BoxZoomTool
~~~~~~~~~~~

* name: ``'box_zoom'``
* icon: |box_zoom_icon|

The box zoom tool allows the user to define a rectangular region to zoom the
plot bounds to. This is done by left-dragging a mouse, or dragging a finger across the
plot area.

LassoSelectTool
~~~~~~~~~~~~~~~

* name: ``'lasso_select'``
* icon: |lasso_select_icon|

The lasso selection tool allows the user to define an arbitrary region for
selection by left-dragging a mouse, or dragging a finger across the plot area.

After a selection is made, the indices of the selected points are available
from properties on the |Selection| object for a glyph data source. For example:

.. code-block:: python

    source.selected.indices

will hold the selected indices in the common case of a "scatter" type glyph.

.. note::
    To make a multiple selection, press the SHIFT key. To clear the selection,
    press the ESC key.

PanTool
~~~~~~~

* name: ``'pan'``, ``'xpan'``, ``'ypan'``,
* icon: |pan_icon|

The pan tool allows the user to pan the plot by left-dragging a mouse or dragging a
finger across the plot region.

It is also possible to constrain the pan tool to only act on either just the x-axis or
just the y-axis by setting the ``dimensions`` property to a list containing ``width``
or ``height``. Additionally, there are tool aliases ``'xpan'`` and ``'ypan'``,
respectively.

.. _userguide_tools_clicktap:

Click/Tap Tools
---------------

These tools are employed by tapping (on touch devices) or left-clicking (on
mouse devices). Only one click/tap tool may be active at a time.

PolySelectTool
~~~~~~~~~~~~~~

* name: ``'poly_select'``
* icon: |poly_select_icon|

The polygon selection tool allows the user to define an arbitrary polygonal
region for selection by left-clicking a mouse, or tapping a finger at different
locations.

After a selection is made, the indices of the selected points are available
from properties on the |Selection| object for a glyph data source. For example:

.. code-block:: python

    source.selected.indices

will hold the selected indices in the common case of a "scatter" type glyph.

.. note::
    Complete the selection by making a double left-click or tapping. To make a
    multiple selection, press the SHIFT key. To clear the selection, press the
    ESC key.

TapTool
~~~~~~~

* name: ``'tap'``
* icon: |tap_icon|

The tap selection tool allows the user to select at single points by clicking
a left mouse button, or tapping with a finger.

After a selection is made, the indices of the selected points are available
from properties on the |Selection| object for a glyph data source. For example:

.. code-block:: python

    source.selected.indices

will hold the selected indices in the common case of a "scatter" type glyph.

.. note::
    To make a multiple selection, press the SHIFT key. To clear the selection,
    press the ESC key.

.. _userguide_tools_scrollpinch:

Scroll/Pinch Tools
------------------

These tools are employed by pinching (on touch devices) or scrolling (on
mouse devices). Only one scroll/pinch tool may be active at a time.

WheelZoomTool
~~~~~~~~~~~~~

* name: ``'wheel_zoom'``, ``'xwheel_zoom'``, ``'ywheel_zoom'``
* icon: |wheel_zoom_icon|

The wheel zoom tool will zoom the plot in and out, centered on the current
mouse location. It will respect any min and max values and ranges, preventing
zooming in and out beyond these values.

It is also possible to constraint the wheel zoom tool to only act on either
just the x-axis or just the y-axis by setting the ``dimensions`` property to
a list containing ``width`` or ``height``. Additionally, there are tool aliases
``'xwheel_zoom'`` and ``'ywheel_zoom'``, respectively.

WheelPanTool
~~~~~~~~~~~~

* name: ``'xwheel_pan'``, ``'ywheel_pan'``
* icon: |wheel_pan_icon|

The wheel pan tool will translate the plot window along the specified
dimension without changing the window's aspect ratio. The tool will respect any
min and max values and ranges, preventing panning beyond these values.

.. _userguide_tools_actions:

Actions
-------

Actions are operations that are activated only when their button in the toolbar
is tapped or clicked. They are typically modal or immediate-acting.

UndoTool
~~~~~~~~

* name: ``'undo'``
* icon: |undo_icon|

The undo tool allows to restore the previous state of the plot.

RedoTool
~~~~~~~~

* name: ``'redo'``
* icon: |redo_icon|

The redo tool reverses the last action performed by the undo tool.

ResetTool
~~~~~~~~~

* name: ``'reset'``
* icon: |reset_icon|

The reset tool will restore the plot ranges to their original values.

SaveTool
~~~~~~~~

* name: ``'save'``
* icon: |save_icon|

The save tool pops up a modal dialog that allows the user to save a PNG image
of the plot.

ZoomInTool
~~~~~~~~~~

* name: ``'zoom_in'``, ``'xzoom_in'``, ``'yzoom_in'``
* icon: |zoom_in_icon|

The zoom-in tool will increase the zoom of the plot. It will respect any min and max
values and ranges, preventing zooming in and out beyond these.

It is also possible to constraint the wheel zoom tool to only act on either
just the x-axis or just the y-axis by setting the ``dimensions`` property to
a list containing ``width`` or ``height``. Additionally, there are tool aliases
``'xzoom_in'`` and ``'yzoom_in'``, respectively.

ZoomOutTool
~~~~~~~~~~~

* name: ``'zoom_out'``, ``'xzoom_out'``, ``'yzoom_out'``
* icon: |zoom_out_icon|

The zoom-out tool will decrease the zoom level of the plot. It will respect any min and
max values and ranges, preventing zooming in and out beyond these values.

It is also possible to constraint the wheel zoom tool to only act on either
just the x-axis or just the y-axis by setting the ``dimensions`` property to
a list containing ``width`` or ``height``. Additionally, there are tool aliases
``'xzoom_in'`` and ``'yzoom_in'``, respectively.

.. _userguide_tools_inspectors:

Inspectors
----------

Inspectors are passive tools that annotate or otherwise report information about
the plot, based on the current cursor position. Any number of inspectors may be
active at any given time. The inspectors menu in the toolbar allows users to
toggle the active state of any inspector.

CrosshairTool
~~~~~~~~~~~~~

* name: ``'crosshair'``
* menu icon: |crosshair_icon|

Th crosshair tool draws a crosshair annotation over the plot, centered on
the current mouse position. The crosshair tool draw dimensions may be
configured by setting the ``dimensions`` property to one of the
enumerated values ``width``, ``height``, or ``both``.

HoverTool
~~~~~~~~~

* name: ``'hover'``
* menu icon: |hover_icon|

The hover tool is a passive inspector tool. It is generally on at all times,
but can be configured in the inspector’s menu associated with the toolbar.

.. _userguide_tools_basic_tooltips:

Basic Tooltips
''''''''''''''

By default, the hover tool will generate a "tabular" tooltip where each row
contains a label and its associated value. The labels and values are supplied
as a list of *(label, value)* tuples. For instance, the tooltip below on the
left was created with the accompanying ``tooltips`` definition on the right.

.. this kind of sucks but gets the job done (aligns hover basic image vertically)

.. raw:: html

    <style>
        div.valign-center > table > tbody { vertical-align: middle !important; }
    </style>

.. container:: valign_center

    +--------------------+-----------------------------------------------------------+
    |                    |::                                                         |
    |                    |                                                           |
    |                    |    hover.tooltips = [                                     |
    |                    |        ("index", "$index"),                               |
    |                    |        ("(x,y)", "($x, $y)"),                             |
    |   |hover_basic|    |        ("radius", "@radius"),                             |
    |                    |        ("fill color", "$color[hex, swatch]:fill_color"),  |
    |                    |        ("foo", "@foo"),                                   |
    |                    |        ("bar", "@bar"),                                   |
    |                    |    ]                                                      |
    +--------------------+-----------------------------------------------------------+

Field names that begin with ``$`` are "special fields". These often correspond
to values that are intrinsic to the plot, such as the coordinates of the mouse
in data or screen space. These special fields are listed here:

:``$index``:
    index of selected point in the data source
:``$name``:
    value of the ``name`` property of the hovered glyph renderer
:``$x``:
    x-coordinate under the cursor in data space
:``$y``:
    y-coordinate under the cursor in data space
:``$sx``:
    x-coordinate under the cursor in screen (canvas) space
:``$sy``:
    y-coordinate under the cursor in screen (canvas) space
:``$color``:
    colors from a data source, with the syntax: ``$color[options]:field_name``.
    The available options are: ``hex`` (to display the color as a hex value),
    and ``swatch`` to also display a small color swatch.

Field names that begin with ``@`` are associated with columns in a
``ColumnDataSource``. For instance, the field name ``"@price"`` will display
values from the ``"price"`` column whenever a hover is triggered. If the hover
is for the 17th glyph, then the hover tooltip will correspondingly display
the 17th price value.

Note that if a column name contains spaces, it must be supplied by
surrounding it in curly braces, e.g. ``@{adjusted close}`` will display values
from a column named ``"adjusted close"``.

Sometimes (especially with stacked charts) it is desirable to allow the
name of the column to be specified indirectly. The field name ``@$name`` is
distinguished in that it will look up the ``name`` field on the hovered
glyph renderer, and use that value as the column name. For instance, if
a user hovers with the name ``"US East"``, then ``@$name`` is equivalent to
``@{US East}``.

Here is a complete example of how to configure and use the hover tool by setting
the ``tooltips`` argument to ``figure``:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_tooltips.py
    :source-position: above

Hit-Testing Behavior
''''''''''''''''''''

The hover tool displays informational tooltips associated with individual
glyphs. These tooltips can be configured to activate in different ways
with a ``mode`` property:

:``"mouse"``:
    only when the mouse is directly over a glyph

:``"vline"``:
    whenever a vertical line from the mouse position intersects a glyph

:``"hline"``:
    whenever a horizontal line from the mouse position intersects a glyph

The default configuration is ``mode = "mouse"``. This can be observed in the
:ref:`userguide_tools_basic_tooltips` example above. The example below in
:ref:`userguide_tools_formatting_tooltip_fields` demonstrates an example that
sets ``mode = "vline"``.

.. _userguide_tools_formatting_tooltip_fields:

Formatting Tooltip Fields
'''''''''''''''''''''''''

By default, values for fields (e.g. ``@foo``) are displayed in a basic numeric
format. However, it is possible to control the formatting of values more
precisely. Fields can be modified by appending a format specified to the end
in curly braces. Some examples are below.

.. code-block:: python

    "@foo{0,0.000}"    # formats 10000.1234 as: 10,000.123

    "@foo{(.00)}"      # formats -10000.1234 as: (10000.123)

    "@foo{($ 0.00 a)}" # formats 1230974 as: $ 1.23 m

The examples above all use the default formatting scheme. But there are
other formatting schemes that can be specified for interpreting format
strings:

:``"numeral"``:
    Provides a wide variety of formats for numbers, currency, bytes, times,
    and percentages. The full set of formats can be found in the
    |NumeralTickFormatter| reference documentation.

:``"datetime"``:
    Provides formats for date and time values. The full set of formats is
    listed in the |DatetimeTickFormatter| reference documentation.

:``"printf"``:
    Provides formats similar to C-style "printf" type specifiers. See the
    |PrintfTickFormatter| reference documentation for complete details.

These are supplied by configuring the ``formatters`` property of a hover
tool. This property maps tooltip variables to format schemes. For example, to
use the ``"datetime"`` scheme for formatting a column ``"@{close date}"``,
set the value:

.. code-block:: python

    hover_tool.formatters = { "@{close date}": "datetime"}

Formatters may also be supplied for "special variables" such as ``"$x"``:

.. code-block:: python

    hover_tool.formatters = { "$x": "datetime"}

If no formatter is specified for a column name, the default ``"numeral"``
formatter is assumed.

Note that format specifications are also compatible with column names that
have spaces. For example, ``@{adjusted close}{($ 0.00 a)}`` applies a format
to a column named "adjusted close".

The example code below shows explicitly configuring a ``HoverTool`` with
different formatters for different fields:

.. code-block:: python

    HoverTool(
        tooltips=[
            ( 'date',   '@date{%F}'            ),
            ( 'close',  '$@{adj close}{%0.2f}' ), # use @{ } for field names with spaces
            ( 'volume', '@volume{0.00 a}'      ),
        ],

        formatters={
            '@date'        : 'datetime', # use 'datetime' formatter for '@date' field
            '@{adj close}' : 'printf',   # use 'printf' formatter for '@{adj close}' field
                                         # use default 'numeral' formatter for other fields
        },

        # display a tooltip whenever the cursor is vertically in line with a glyph
        mode='vline'
    )

You can see the output generated by this configuration by hovering the mouse
over the plot below:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_tooltip_formatting.py
    :source-position: none

Using the |CustomJSHover| model, it is also possible to use JavaScript
to specify a custom formatter that can display derived quantities in the
tooltip.

.. _userguide_tools_image_hover:

Image Hover
'''''''''''

The hover tool can be used to inspect image glyphs which may contain
layers of data in the corresponding ``ColumnDataSource``:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_tooltips_image.py
    :source-position: above

In this example, three image patterns are defined, named ``ramp``,
``steps``, and ``bitmask``. The hover tooltip shows the index of the
image, the name of the pattern, the ``x`` and ``y`` position of the
cursor, as well as the corresponding value and value squared.

.. _custom_hover_tooltip:

Custom Tooltip
''''''''''''''

It is also possible to supply a custom HTML template for a tooltip. To do
this, pass an HTML string, with the Bokeh tooltip field name symbols wherever
substitutions are desired. All of the information above regarding formats, etc.
still applies. Note that you can also use the ``{safe}`` format after the
column name to disable the escaping of HTML in the data source. An example is
shown below:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_custom_tooltip.py
    :source-position: above


.. _userguide_tools_edit:

Edit Tools
----------

The edit tools provide functionality for drawing and editing glyphs
client-side by adding, modifying, and deleting ``ColumnDataSource``
data.

All the edit tools share a small number of key bindings:

SHIFT
  Modifier key to add to selection or start drawing

BACKSPACE
  Deletes the selected glyphs

ESC
  Clear the selection

.. note::
   On MacBooks and some other keyboards, the BACKSPACE key is labeled
   "delete".

BoxEditTool
~~~~~~~~~~~

* name: ``'box_edit'``
* menu icon: |box_edit_icon|

The BoxEditTool allows drawing, dragging, and deleting ``Rect`` glyphs
on one or more renderers by editing the underlying
``ColumnDataSource`` data. Like other drawing tools, the renderers
that are to be edited must be supplied explicitly as a list:

.. code-block:: python

    r1 = p.rect('x', 'y', 'width', 'height', source=source)
    r2 = p.rect('x', 'y', 'width', 'height', source=source2)
    tool = BoxEditTool(renderers=[r1, r2])

The tool will automatically modify the columns on the data source
corresponding to the ``x``, ``y``, ``width``, and ``height`` values of
the glyph. Any additional columns in the data source will be padded
with the declared ``empty_value``, when adding a new box. When drawing
a new box, the data will always be added to the ``ColumnDataSource`` on
the first supplied renderer.

It is also often useful to limit the number of elements that can be
drawn, e.g. when specifying a specific number of regions of interest.
Using the ``num_objects`` property, we can ensure that once the limit
has been reached, the oldest box will be popped off the queue to make
space for the new box being added.

.. raw:: html

    <img src="https://docs.bokeh.org/static/box_edit_keyboard_optimized.gif"
     width='400px' alt="Animation showing box draw, select and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor and key strokes by
showing the pressed keys. The ``BoxEditTool`` can **Add**, **Move**
and **Delete** boxes on plots:

Add box
  Hold shift, then click and drag anywhere on the plot or double tap
  once to start drawing, move the mouse and double tap again to
  finish drawing.

Move box
  Click and drag an existing box. The box will be dropped once you let
  go of the mouse button.

Delete box
  Tap a box to select it then press the BACKSPACE key while the mouse is
  within the plot area.

To **Move** or **Delete** multiple boxes at once:

Move selection
  Select box(es) with SHIFT+tap (or another selection tool) then drag
  anywhere on the plot. Selecting and then dragging on a specific box
  will move both.

Delete selection
  Select box(es) with SHIFT+tap (or another selection tool) then press
  BACKSPACE while the mouse is within the plot area.

.. bokeh-plot:: docs/user_guide/examples/tools_box_edit.py
    :source-position: none


FreehandDrawTool
~~~~~~~~~~~~~~~~

* name: ``'freehand_draw'``
* menu icon: |freehand_draw_icon|

The ``FreehandDrawTool`` allows freehand drawing of lines and polygons
using the ``Patches`` and ``MultiLine`` glyphs, by editing the
underlying ``ColumnDataSource`` data. Like other drawing tools, the
renderers that are to be edited must be supplied explicitly as a
list:

.. code-block:: python

    r = p.multi_line('xs', 'ys' source=source)
    tool = FreehandDrawTool(renderers=[r])

The tool will automatically modify the columns on the data source
corresponding to the ``xs`` and ``ys`` values of the glyph. Any
additional columns in the data source will be padded with the declared
``empty_value``, when adding a new point. Any newly added patch or
multi-line will be inserted on the ``ColumnDataSource`` of the first
supplied renderer.

It is also often useful to limit the number of elements that can be
drawn, e.g. when specifying a specific number of regions of interest.
Using the ``num_objects`` property, we can ensure that once the limit
has been reached, the oldest patch/multi-line will be popped off the
queue to make space for the new patch/multi-line being added.

.. raw:: html

    <img src="https://docs.bokeh.org/static/freehand_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing freehand drawing and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor and key strokes by
showing the pressed keys. The ``PolyDrawTool`` can **Draw** and
**Delete** patches and multi-lines:

Draw patch/multi-line
  Click and drag to start drawing and release the mouse button to
  finish drawing

Delete patch/multi-line
  Tap a line or patch to select it then press the BACKSPACE key while the
  mouse is within the plot area.

 To **Delete** multiple patches/lines at once:

Delete selection
  Select patches/lines with SHIFT+tap (or another selection tool), then
  press BACKSPACE while the mouse is within the plot area.

PointDrawTool
~~~~~~~~~~~~~

* name: ``'point_draw'``
* menu icon: |point_draw_icon|

The ``PointDrawTool`` allows adding, dragging, and deleting point-like
glyphs (of ``XYGlyph`` type) on one or more renderers by editing the
underlying ``ColumnDataSource`` data. Like other drawing tools, the
renderers that are to be edited must be supplied explicitly as a
list:

.. code-block:: python

    c1 = p.circle('x', 'y', 'width', 'height', source=source)
    r1 = p.rect('x', 'y', 0.1, 0.1, source=source2)
    tool = PointDrawTool(renderers=[c1, r1])

The tool will automatically modify the columns on the data source
corresponding to the ``x`` and ``y`` values of the glyph. Any
additional columns in the data source will be padded with the declared
``empty_value``, when adding a new point. Any newly added points will
be inserted on the ``ColumnDataSource`` of the first supplied
renderer.

It is also often useful to limit the number of elements that can be
drawn. Using the ``num_objects`` property, we can ensure that once the
limit has been reached, the oldest point will be popped off the queue
to make space for the new point being added.

.. raw:: html

    <img src="https://docs.bokeh.org/static/point_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing point draw, drag, select and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor and key strokes by
showing the pressed keys. The PointDrawTool can **Add**, **Move**, and
**Delete** point-like glyphs on plots:

Add point
  Tap anywhere on the plot.

Move point
  Tap and drag an existing point. The point will be dropped once
  you let go of the mouse button.

Delete point
  Tap a point to select it then press BACKSPACE key while the mouse is
  within the plot area.

To **Move** or **Delete** multiple points at once:

Move selection
  Select point(s) with SHIFT+tap (or another selection tool), then drag
  anywhere on the plot. Selecting and then dragging a specific point
  will move both.

Delete selection
  Select point(s) with SHIFT+tap (or another selection tool), then
  press BACKSPACE while the mouse is within the plot area.

.. bokeh-plot:: docs/user_guide/examples/tools_point_draw.py
    :source-position: none


PolyDrawTool
~~~~~~~~~~~~

* name: ``'poly_draw'``
* menu icon: |poly_draw_icon|

The ``PolyDrawTool`` allows drawing, selecting, and deleting
``Patches`` and ``MultiLine`` glyphs on one or more renderers by
editing the underlying ``ColumnDataSource`` data. Like other drawing
tools, the renderers that are to be edited must be supplied explicitly
as a list.

The tool will automatically modify the columns on the data source
corresponding to the ``xs`` and ``ys`` values of the glyph. Any
additional columns in the data source will be padded with the declared
``empty_value``, when adding a new point. Any newly added patch or
multi-line will be inserted on the ``ColumnDataSource`` of the first
supplied renderer.

It is also often useful to limit the number of elements that can be
drawn, e.g. when specifying a specific number of regions of interest.
Using the ``num_objects`` property, we can ensure that once the limit
has been reached the oldest patch/multi-line will be popped off the
queue to make space for the new patch/multi-line being added.

If a ``vertex_renderer`` with a point-like glyph is supplied, the
PolyDrawTool it will use it to display the vertices of the
multi-lines/patches on all supplied renderers. This also enables the
ability to snap to existing vertices while drawing.

.. raw:: html

    <img src="https://docs.bokeh.org/static/poly_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing polygon draw, select and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor and key strokes by
showing the pressed keys. The ``PolyDrawTool`` can **Add**, **Move**,
and **Delete** patches and multi-lines:

Add patch/multi-line
  Double tap to add the first vertex, then use tap to add each
  subsequent vertex. To finalize the draw action, double tap to insert
  the final vertex or press the ESC key.

Move patch/multi-line
  Tap and drag an existing patch/multi-line. The point will be dropped
  once you let go of the mouse button.

Delete patch/multi-line
  Tap a patch/multi-line to select it, then press the BACKSPACE key while
  the mouse is within the plot area.

.. bokeh-plot:: docs/user_guide/examples/tools_poly_draw.py
    :source-position: none


PolyEditTool
~~~~~~~~~~~~~~

* name: ``'poly_edit'``
* menu icon: |poly_edit_icon|

The PolyEditTool allows editing the vertices of one or more
``Patches`` or ``MultiLine`` glyphs. The glyphs to be edited can
be defined via the ``renderers`` property. The renderer for the
vertices can be defined via the ``vertex_renderer``, which must
render a point-like Glyph (of ``XYGlyph`` type).

The tool will automatically modify the columns on the data source
corresponding to the ``xs`` and ``ys`` values of the glyph. Any
additional columns in the data source will be padded with the declared
``empty_value``, when adding a new point.

.. raw:: html

    <img src="https://docs.bokeh.org/static/poly_edit_keyboard_optimized.gif"
     width='400px' alt="Animation showing polygon and vertex drag, select and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor and key strokes by
showing the pressed keys. The ``PolyEditTool`` can **Add**, **Move**,
and **Delete** vertices on existing patches and multi-lines:

Show vertices
  Double tap an existing patch or multi-line

Add vertex
  Double tap an existing vertex to select it. The tool will draw the
  next point. To add it, tap in a new location. To finish editing
  and add a point, double tap. Otherwise press the ESC key to cancel.

Move vertex
  Drag an existing vertex and let go of the mouse button to release
  it.

Delete vertex
  After selecting one or more vertices, press BACKSPACE while the mouse
  cursor is within the plot area.

.. bokeh-plot:: docs/user_guide/examples/tools_poly_edit.py
    :source-position: none


.. _userguide_tools_lod:

Controlling Level of Detail
---------------------------

Although the HTML canvas can comfortably display tens or even hundreds of
thousands of glyphs, doing so can have adverse effects on interactive
performance. In order to accommodate large-ish (but not enormous) data
sizes, Bokeh plots offer "Level of Detail" (LOD) capability in the client.

.. note::
    Another option when dealing with very large data volumes is to use the
    Bokeh Server to perform downsampling on data before it is sent to the
    browser. Such an approach is unavoidable past a certain data size. See
    :ref:`userguide_server` for more information.

The basic idea is that during interactive operations (e.g., panning or
zooming), the plot only draws some small fraction of data points. This
hopefully allows the general sense of the interaction to be preserved
mid-flight, while maintaining interactive performance. There are four
properties on |Plot| objects that control LOD behavior:

.. bokeh-prop:: Plot.lod_factor
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_interval
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_threshold
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_timeout
    :module: bokeh.models.plots


.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |HoverTool| replace:: :class:`~bokeh.models.tools.HoverTool`
.. |CustomJSHover| replace:: :class:`~bokeh.models.tools.CustomJSHover`

.. |NumeralTickFormatter| replace:: :class:`~bokeh.models.formatters.NumeralTickFormatter`
.. |DatetimeTickFormatter| replace:: :class:`~bokeh.models.formatters.DatetimeTickFormatter`
.. |PrintfTickFormatter| replace:: :class:`~bokeh.models.formatters.PrintfTickFormatter`

.. |Selection| replace:: :class:`~bokeh.models.selections.Selection`

.. |hover_basic| image:: /_images/hover_basic.png

.. |box_select_icon| image:: /_images/icons/BoxSelect.png
    :height: 19px
.. |box_zoom_icon| image:: /_images/icons/BoxZoom.png
    :height: 19px
.. |help_icon| image:: /_images/icons/Help.png
    :height: 19px
.. |crosshair_icon| image:: /_images/icons/Crosshair.png
    :height: 19px
.. |hover_icon| image:: /_images/icons/Hover.png
    :height: 19px
.. |lasso_select_icon| image:: /_images/icons/LassoSelect.png
    :height: 19px
.. |pan_icon| image:: /_images/icons/Pan.png
    :height: 19px
.. |poly_select_icon| image:: /_images/icons/PolygonSelect.png
    :height: 19px
.. |redo_icon| image:: /_images/icons/Redo.png
    :height: 19px
.. |reset_icon| image:: /_images/icons/Reset.png
    :height: 19px
.. |save_icon| image:: /_images/icons/Save.png
    :height: 19px
.. |tap_icon| image:: /_images/icons/Tap.png
    :height: 19px
.. |undo_icon| image:: /_images/icons/Undo.png
    :height: 19px
.. |wheel_pan_icon| image:: /_images/icons/WheelPan.png
    :height: 19px
.. |wheel_zoom_icon| image:: /_images/icons/WheelZoom.png
    :height: 19px
.. |zoom_in_icon| image:: /_images/icons/ZoomIn.png
    :height: 19px
.. |zoom_out_icon| image:: /_images/icons/ZoomOut.png
    :height: 19px
.. |box_edit_icon| image:: /_images/icons/BoxEdit.png
    :height: 19px
.. |freehand_draw_icon| image:: /_images/icons/FreehandDraw.png
    :height: 19px
.. |point_draw_icon| image:: /_images/icons/PointDraw.png
    :height: 19px
.. |poly_draw_icon| image:: /_images/icons/PolyDraw.png
    :height: 19px
.. |poly_edit_icon| image:: /_images/icons/PolyEdit.png
    :height: 19px
