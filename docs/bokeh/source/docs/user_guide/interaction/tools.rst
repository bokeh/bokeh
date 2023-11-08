.. _ug_interaction_tools:

Plot tools
==========

Bokeh comes with a number of interactive tools that you can use to report
information, to change plot parameters such as zoom level or range extents,
or to add, edit, or delete glyphs. Tools can be grouped into four basic
categories:

Gestures
    These tools respond to single gestures, such as a pan movement.
    The types of gesture tools are:

    - :ref:`ug_interaction_tools_pandrag`
    - :ref:`ug_interaction_tools_clicktap`
    - :ref:`ug_interaction_tools_scrollpinch`

    For each type of gesture, only one tool can be active at any given time.
    The active tool is highlighted on the toolbar next to the
    tool icon.

:ref:`ug_interaction_tools_actions`
    These are immediate or modal operations that are only activated when their
    button in the toolbar is pressed, such as the ``ResetTool`` or
    ``ExamineTool``.

:ref:`ug_interaction_tools_inspectors`
    These are passive tools that report information or annotate plots in some
    way, such as the ``HoverTool`` or ``CrosshairTool``.

:ref:`ug_interaction_tools_edit`
    These are sophisticated multi-gesture tools that can add, delete, or modify
    glyphs on a plot. Since they may respond to several gestures at once, an
    edit tool when activated will potentially deactivate multiple single-gesture tools.

This chapter contains information about all the individual tools and describes how
the toolbar may be configured.

.. _ug_interaction_tools_toolbar:

Positioning the toolbar
-----------------------

By default, Bokeh plots come with a toolbar above the plot. You can change the
location of the toolbar or remove it.

You can specify the toolbar location by passing the ``toolbar_location``
parameter to the |figure| function. Valid values are:

* ``"above"``
* ``"below"``
* ``"left"``
* ``"right"``

If you would like to hide the toolbar entirely, pass ``None``.

The code below positions the toolbar below the plot. Try
running the code and changing the ``toolbar_location`` value.

.. bokeh-plot:: __REPO__/examples/interaction/tools/position_toolbar_clash.py
    :source-position: above

Note that the toolbar position clashes with the default axes. In this case,
setting the ``toolbar_sticky`` option to ``False`` will move the toolbar
outside of the area where the axis is drawn.

.. bokeh-plot:: __REPO__/examples/interaction/tools/position_toolbar.py
    :source-position: above

.. _ug_interaction_tools_specifying_tools:

Specifying tools
----------------

At the lowest |bokeh.models| level, you can add tools to a ``Plot`` by
passing instances of ``Tool`` objects to the ``add_tools()`` method:

.. code-block:: python

    from bokeh.models import LassoSelectTool, Plot, WheelZoomTool

    plot = Plot()
    plot.add_tools(LassoSelectTool())

    wheel = WheelZoomTool()
    plot.add_tools(wheel)

This way of adding tools works with any Bokeh ``Plot`` or ``Plot`` subclass,
such as ``figure``.

You can specify tools by passing the ``tools`` parameter to the |figure|
function. The tools parameter accepts a list of tool objects, for example:

.. code-block:: python

    from bokeh.models import BoxZoomTool, ResetTool
    from bokeh.plotting import figure

    plot = figure(tools=[BoxZoomTool(), ResetTool()])

You can also add multiple tools with a comma-separated string
containing tool shortcut names:

.. code-block:: python

    from bokeh.plotting import figure

    plot = figure(tools="pan,wheel_zoom,box_zoom,reset")

This method does not allow setting properties of the tools.

Remove tools by passing a tool object to the ``remove_tools()`` method of a plot.

.. code-block:: python

    from bokeh.models import BoxSelectTool, WheelZoomTool
    from bokeh.plotting import figure

    tools = box, wheel = BoxSelectTool(dimensions="width"), WheelZoomTool()
    plot = figure(tools=tools)

    plot.remove_tools(box)

.. _ug_interaction_tools_customize_tools_icon:

Customizing tools icon
----------------------
You can change the :ref:`bokeh.models.tools` tooltip by passing it to
the ``description`` keyword using the ``add_tools()`` method of a plot or any
of it's instances like |figure|.

.. code-block:: python

    plot.add_tools(BoxSelectTool(description="My tool"))

It's also possible to change a tool icon using the ``icon`` keyword.

You can pass:

1. A well known icon name

   .. code-block:: python

       plot.add_tools(BoxSelectTool(icon="box_zoom"))

2. A CSS selector

   .. code-block:: python

       plot.add_tools(BoxSelectTool(icon=".my-icon-class"))

3. An image path

   .. code-block:: python

       plot.add_tools(BoxSelectTool(icon="path/to/icon"))

.. _ug_interaction_tools_setting_active_tools:

Setting the active tools
------------------------

Bokeh toolbars can have at most one active tool from each kind of gesture
(drag, scroll, tap).

However, it is possible to exert control over which tool is active. At the
lowest |bokeh.models| level, you can do this by using the ``active_drag``,
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

You can specify active tools by passing these properties as keyword
arguments to the |figure| function. It is also possible to pass any one of
the string names:

.. code-block:: python

    # configures the lasso tool to be active
    plot = figure(tools="pan,lasso_select,box_select", active_drag="lasso_select")

.. _ug_interaction_tools_autohide:

Toggling ToolBar autohide
-------------------------

To make your toolbar hide automatically, set the toolbar's
:class:`~bokeh.models.tools.Toolbar.autohide` property to True. When you set
``autohide`` to True, the toolbar is visible only when the mouse is inside the
plot area and is otherwise hidden.

.. bokeh-plot:: __REPO__/examples/interaction/tools/toolbar_autohide.py
    :source-position: above

.. _ug_interaction_tools_overlays:

Styling tool overlays
---------------------

Some Bokeh tools also have configurable visual attributes.

For instance, the various region selection tools and the box zoom tool all have
an ``overlay``. To style their line and fill properties, pass values to the
respective attributes:

.. bokeh-plot:: __REPO__/examples/interaction/tools/tool_overlays.py
    :source-position: above

For more information, see the reference guide's entries for
:class:`BoxSelectTool.overlay <bokeh.models.tools.BoxSelectTool.overlay>`,
:class:`BoxZoomTool.overlay <bokeh.models.tools.BoxZoomTool.overlay>`,
:class:`LassoSelectTool.overlay <bokeh.models.tools.LassoSelectTool.overlay>`,
:class:`PolySelectTool.overlay <bokeh.models.tools.PolySelectTool.overlay>`, and
:class:`RangeTool.overlay <bokeh.models.tools.RangeTool.overlay>`.

.. _ug_interaction_tools_pandrag:

Pan/Drag tools
--------------

You can use these tools by panning (on touch devices) or left-dragging (on
mouse devices). Only one pan/drag tool may be active at a time. Where
applicable, Pan/Drag tools will respect any max and min values set on ranges.

BoxSelectTool
~~~~~~~~~~~~~

* name: ``'box_select'``
* icon: |box_select_icon|

The box selection tool allows you to define a rectangular selection
by left-dragging a mouse, or dragging a finger across the plot area.
You can configure the box select tool to select across only one dimension by
setting the ``dimensions`` property to ``width`` or ``height`` instead of the
default ``both``.

After a selection is made, the indices of the selected points are available
from properties on the |Selection| object for a glyph data source. For example:

.. code-block:: python

    source.selected.indices

will hold the selected indices in the common case of a "scatter" type glyph.

.. note::
    To make multiple selections, press the SHIFT key. To clear the
    selection, press the ESC key.

BoxZoomTool
~~~~~~~~~~~

* name: ``'box_zoom'``
* icon: |box_zoom_icon|

The box zoom tool allows you to define a rectangular region to zoom the
plot bounds to by left-dragging a mouse, or dragging a finger across the
plot area.

LassoSelectTool
~~~~~~~~~~~~~~~

* name: ``'lasso_select'``
* icon: |lasso_select_icon|

The lasso selection tool allows you to define an arbitrary region for
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

The pan tool allows you to pan the plot by left-dragging a mouse or dragging a
finger across the plot region.

You can configure the pan tool to act only on either the x-axis or
the y-axis by setting the ``dimensions`` property to a list containing ``width``
or ``height``. Additionally, there are tool names ``'xpan'`` and ``'ypan'``,
respectively.

.. _ug_interaction_tools_clicktap:

Click/Tap tools
---------------

Use these tools by tapping (on touch devices) or left-clicking (on
mouse devices). Only one click/tap tool may be active at a time.

PolySelectTool
~~~~~~~~~~~~~~

* name: ``'poly_select'``
* icon: |poly_select_icon|

The polygon selection tool allows you to define an arbitrary polygonal
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

The tap selection tool allows you to select single points by clicking
the left mouse button, or tapping with a finger.

After a selection is made, the indices of the selected points are available
from properties on the |Selection| object for a glyph data source. For example:

.. code-block:: python

    source.selected.indices

will hold the selected indices in the common case of a "scatter" type glyph.

.. note::
    To make a multiple selection, press the SHIFT key. To clear the selection,
    press the ESC key.

.. _ug_interaction_tools_scrollpinch:

Scroll/Pinch tools
------------------

Use these tools by pinching (on touch devices) or scrolling (on
mouse devices). Only one scroll/pinch tool may be active at a time.

WheelZoomTool
~~~~~~~~~~~~~

* name: ``'wheel_zoom'``, ``'xwheel_zoom'``, ``'ywheel_zoom'``
* icon: |wheel_zoom_icon|

You can use the wheel zoom tool to zoom the plot in and out, centering on the current
mouse location. It will respect any min and max values and ranges, preventing
zooming in and out beyond these values.

You can configure the wheel zoom tool to act only on either
the x-axis or the y-axis by setting the ``dimensions`` property to
a list containing ``width`` or ``height``. Additionally, there are tool names
``'xwheel_zoom'`` and ``'ywheel_zoom'``, respectively.

WheelPanTool
~~~~~~~~~~~~

* name: ``'xwheel_pan'``, ``'ywheel_pan'``
* icon: |wheel_pan_icon|

The wheel pan tool translates the plot window along a specified
dimension without changing the window's aspect ratio. It will respect any
min and max values and ranges, preventing panning beyond these values.

.. _ug_interaction_tools_actions:

Actions
-------

Actions are operations that are activated only when their button in the toolbar
is tapped or clicked. They are typically modal or immediate-acting.

ExamineTool
~~~~~~~~~~~

* name: ``'examine'``

The examine tool displays a modal dialog that affords a view of all the current
property values for every object that is part of the plot.

.. note::
    In the future, the ``ExamineTool`` will be activated via a context menu and
    be available for all objects, not only plots.

UndoTool
~~~~~~~~

* name: ``'undo'``
* icon: |undo_icon|

The undo tool restores the previous state of the plot.

RedoTool
~~~~~~~~

* name: ``'redo'``
* icon: |redo_icon|

The redo tool reverses the last action performed by the undo tool.

ResetTool
~~~~~~~~~

* name: ``'reset'``
* icon: |reset_icon|

The reset tool restores the plot ranges to their original values.

SaveTool
~~~~~~~~

* name: ``'save'``
* icon: |save_icon|

The save tool allows you to save a PNG image of the plot. By default, you will be
prompted for a filename. Alternatively, you can create an instance of the tool
yourself and provide a filename:

.. code-block:: python

    SaveTool(filename='custom_filename') # png extension not needed

Either way, the file will then be downloaded directly or a modal dialog will open
depending on your browser.

ZoomInTool
~~~~~~~~~~

* name: ``'zoom_in'``, ``'xzoom_in'``, ``'yzoom_in'``
* icon: |zoom_in_icon|

The zoom-in tool increases the zoom of the plot. It will respect any min and max
values and ranges, preventing zooming in and out beyond these.

You can configure the wheel zoom tool to act only on either
the x-axis or the y-axis by setting the ``dimensions`` property to
a list containing ``width`` or ``height``. Additionally, there are tool names
``'xzoom_in'`` and ``'yzoom_in'``, respectively.

ZoomOutTool
~~~~~~~~~~~

* name: ``'zoom_out'``, ``'xzoom_out'``, ``'yzoom_out'``
* icon: |zoom_out_icon|

The zoom-out tool decreases the zoom level of the plot. It will respect any min and
max values and ranges, preventing zooming in and out beyond these values.

You can configure the wheel zoom tool to act only on either
the x-axis or the y-axis by setting the ``dimensions`` property to
a list containing ``width`` or ``height``. Additionally, there are tool names
``'xzoom_in'`` and ``'yzoom_in'``, respectively.

.. _ug_interaction_tools_inspectors:

Inspectors
----------

Inspectors are passive tools that annotate or report information about
the plot based on the current cursor position. Multiple inspectors may be
active at any given time. You can toggle the active state of an inspector
in the inspectors menu in the toolbar.

CrosshairTool
~~~~~~~~~~~~~

* name: ``'crosshair'``
* menu icon: |crosshair_icon|

The crosshair tool draws a crosshair annotation over the plot, centered on
the current mouse position. You can configure the crosshair tool dimensions
by setting the ``dimensions`` property to ``width``, ``height``, or ``both``.

.. _ug_interaction_tools_hover_tool:

HoverTool
~~~~~~~~~

* name: ``'hover'``
* menu icon: |hover_icon|

The hover tool is a passive inspector tool. It defaults to be on at all times,
but you can change this in the inspector’s menu in the toolbar.

.. _ug_interaction_tools_basic_tooltips:

Basic Tooltips
''''''''''''''

By default, the hover tool generates a "tabular" tooltip where each row
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
    |                    |        ("fill color", "$color[hex]:fill_color"),          |
    |                    |        ("fill color", "$color:fill_color"),               |
    |                    |        ("fill color", "$swatch:fill_color"),              |
    |                    |        ("foo", "@foo"),                                   |
    |                    |        ("bar", "@bar"),                                   |
    |                    |    ]                                                      |
    +--------------------+-----------------------------------------------------------+

Field names that begin with ``$`` are "special fields". These often correspond
to values that are part of the plot, such as the coordinates of the mouse
in data or screen space. These special fields are listed here:

``$index``
    index of selected point in the data source
``$glyph_view``
    a reference to the glyph view for the glyph that was hit
``$name``
    value of the ``name`` property of the hovered glyph renderer
``$x``
    x-coordinate under the cursor in data space
``$y``
    y-coordinate under the cursor in data space
``$sx``
    x-coordinate under the cursor in screen (canvas) space
``$sy``
    y-coordinate under the cursor in screen (canvas) space
``$snap_x``
    x-coordinate where the tooltip is anchored in data space
``$snap_y``
    y-coordinate where the tooltip is anchored in data space
``$snap_sx``
    x-coordinate where the tooltip is anchored in screen (canvas) space
``$snap_sy``
    y-coordinate where the tooltip is anchored in screen (canvas) space
``$color``
    colors from a data source, with the syntax: ``$color[options]:field_name``.
    The available options are: ``hex`` (to display the color as a hex value),
    ``swatch`` (color data from data source displayed as a small color box).
``$swatch``
    color data from data source displayed as a small color box.

Additionally, certain glyphs may report additional data that is specific to
that glyph

``$indices``
    indices of all the selected points in the data source
``$segment_index``
    segment index of a selected sub-line (multi-line glyphs only)
``$image_index``
    pixel index into an image array (image glyphs only)

Field names that begin with ``@`` are associated with columns in a
``ColumnDataSource``. For instance, the field name ``"@price"`` will display
values from the ``"price"`` column whenever a hover is triggered. If the hover
is for the 17th glyph instance, then the hover tooltip will display the 17th price value.

Note that if a column name contains spaces, it must be surrounded by
curly braces. For example, configuring ``@{adjusted close}`` will display values
from a column named ``"adjusted close"``.

Sometimes, especially with stacked charts, it is desirable to allow the
name of the column to be specified indirectly. In this case, use the field name
``@$name`` to look up the ``name`` field on the hovered glyph renderer, and use
that value as the column name. For instance, if you hover with the name
``"US East"``, then ``@$name`` is equivalent to ``@{US East}``.

Here is a complete example of how to configure and use the hover tool by setting
the ``tooltips`` argument to ``figure``:

.. bokeh-plot:: __REPO__/examples/interaction/tools/hover_tooltips.py
    :source-position: above

Hit-Testing behavior
''''''''''''''''''''

The hover tool displays tooltips associated with individual glyphs. You can configure
these tooltips to activate in different ways with a ``mode`` property:

:``"mouse"``:
    only when the mouse is directly over a glyph

:``"vline"``:
    whenever a vertical line from the mouse position intersects a glyph

:``"hline"``:
    whenever a horizontal line from the mouse position intersects a glyph

The default configuration is ``mode = "mouse"``. See this in the
:ref:`ug_interaction_tools_basic_tooltips` example above. The example below in
:ref:`ug_interaction_tools_formatting_tooltip_fields` demonstrates ``mode = "vline"``.

.. _ug_interaction_tools_formatting_tooltip_fields:

Formatting tooltip fields
'''''''''''''''''''''''''

By default, values for fields (``@foo``, for example) are displayed in a basic numeric
format. To control the formatting of values, you can modify fields by appending
a specified format to the end in curly braces. Some examples are below.

.. code-block:: python

    "@foo{0,0.000}"    # formats 10000.1234 as: 10,000.123

    "@foo{(.00)}"      # formats -10000.1234 as: (10000.123)

    "@foo{($ 0.00 a)}" # formats 1230974 as: $ 1.23 m

The examples above all use the default formatting scheme. There are
other formatting schemes you can specify:

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

You can add these by configuring the ``formatters`` property of a hover
tool. This property maps tooltip variables to format schemes. For example, to
use the ``"datetime"`` scheme for formatting a column ``"@{close date}"``,
set the value:

.. code-block:: python

    hover_tool.formatters = { "@{close date}": "datetime"}

You can also supply formatters for "special variables" such as ``"$x"``:

.. code-block:: python

    hover_tool.formatters = { "$x": "datetime"}

If a formatter is not specified for a column name, the default ``"numeral"``
formatter is assumed.

Note that format specifications are also compatible with column names that
have spaces. For example, ``@{adjusted close}{($ 0.00 a)}`` applies a format
to a column named "adjusted close".

The example code below configures a ``HoverTool`` with different formatters
for different fields:

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

You can see the output generated from this configuration by hovering the mouse
over the plot below:

.. bokeh-plot:: __REPO__/examples/interaction/tools/hover_tooltip_formatting.py
    :source-position: none

The |CustomJSHover| model allows you to use JavaScript to specify a custom
formatter that can display derived quantities in the tooltip.

.. _ug_interaction_tools_image_hover:

Image hover
'''''''''''

You can use the hover tool to inspect image glyphs which may contain
layers of data in the corresponding ``ColumnDataSource``:

.. bokeh-plot:: __REPO__/examples/interaction/tools/hover_tooltips_image.py
    :source-position: above

In this example, three image patterns are defined, ``ramp``,
``steps``, and ``bitmask``. The hover tooltip shows the index of the
image, the name of the pattern, the ``x`` and ``y`` position of the
cursor, as well as the corresponding value and value squared.

.. _custom_hover_tooltip:

Custom tooltip
''''''''''''''

You can supply a custom HTML template for a tooltip. To do
this, pass an HTML string with the Bokeh tooltip field name symbols wherever
substitutions are desired. All of the information above regarding formats
still applies. Note that you can also use the ``{safe}`` format after the
column name to disable the escaping of HTML in the data source. See the example
below:

.. bokeh-plot:: __REPO__/examples/interaction/tools/hover_custom_tooltip.py
    :source-position: above

.. seealso::
    See :ref:`ug_interaction_tooltips` for more general information on
    using tooltips with Bokeh.

.. _ug_interaction_tools_edit:

Edit tools
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
  Clears the selection

.. note::
   On MacBooks and some other keyboards, the BACKSPACE key is labeled
   "delete".

BoxEditTool
~~~~~~~~~~~

* name: ``'box_edit'``
* menu icon: |box_edit_icon|

The BoxEditTool() allows you to draw, drag, and delete ``Rect`` glyphs
on one or more renderers by editing the underlying ``ColumnDataSource``
data. Like other drawing tools, you must pass the renderers to be edited
as a list:

.. code-block:: python

    r1 = p.rect('x', 'y', 'width', 'height', source=source)
    r2 = p.rect('x', 'y', 'width', 'height', source=source2)
    tool = BoxEditTool(renderers=[r1, r2])

The tool automatically modifies the columns of the data source
corresponding to the ``x``, ``y``, ``width``, and ``height`` values of
the glyph. Any additional columns in the data source will be padded with
their respective default values when adding a new point. Any newly added
points will be inserted in the ``ColumnDataSource`` of the first supplied
renderer.

.. _ug_interaction_tools_default_values:

Columns' default values are computed based on (in order):

1. Tool's ``default_overrides``, which are user provided.
2. Data source's ``default_values``, which are user provided.
3. Data source's inferred default values, which are computed by the data
   source based on column's ``dtype`` or contents.
4. Tool's ``empty_value``, which is user provided and is the measure of
   last resort when a sensible value can't be determined in the previous
   steps.

It is often useful to limit the number of elements that can be
drawn. For example, when specifying a certain number of regions of interest.
Using the ``num_objects`` property, you can ensure that once the limit
has been reached, the oldest box will be popped off the queue to make
space for the newest box being added.

.. raw:: html

    <img src="https://docs.bokeh.org/static/box_edit_keyboard_optimized.gif"
     width='400px' alt="Animation showing box draw, select, and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor, and key strokes by
showing the pressed keys. The ``BoxEditTool`` can **Add**, **Move**
and **Delete** boxes on plots:

Add box
  Hold shift, then click and drag anywhere on the plot or double tap
  once to start drawing. Move the mouse and double tap again to
  finish drawing.

Move box
  Click and drag an existing box. The box will be dropped once you let
  go of the mouse button.

Delete box
  Tap a box to select it, then press the BACKSPACE key while the mouse is
  within the plot area.

To **Move** or **Delete** multiple boxes at once:

Move selection
  Select box(es) with SHIFT+tap (or another selection tool) then drag
  anywhere on the plot. Selecting and then dragging on a specific box
  will move both.

Delete selection
  Select box(es) with SHIFT+tap (or another selection tool) then press
  BACKSPACE while the mouse is within the plot area.

.. bokeh-plot:: __REPO__/examples/interaction/tools/box_edit.py
    :source-position: none


FreehandDrawTool
~~~~~~~~~~~~~~~~

* name: ``'freehand_draw'``
* menu icon: |freehand_draw_icon|

The ``FreehandDrawTool()`` allows freehand drawing of lines and polygons
using the ``Patches`` and ``MultiLine`` glyphs, by editing the
underlying ``ColumnDataSource`` data. Like other drawing tools,
you must pass the renderers to be edited as a list:

.. code-block:: python

    r = p.multi_line('xs', 'ys' source=source)
    tool = FreehandDrawTool(renderers=[r])

The tool automatically modifies the columns on the data source
corresponding to the ``xs`` and ``ys`` values of the glyph. Any
additional columns in the data source will be padded in accordance
to :ref:`ug_interaction_tools_default_values` procedure when adding
a new point.  Any newly added points will be inserted in the
``ColumnDataSource`` of the first supplied renderer.

It is also often useful to limit the number of elements that can be
drawn. For example, when specifying a specific number of regions of interest.
Using the ``num_objects`` property, you can ensure that once the limit
has been reached, the oldest patch/multi-line will be popped off the
queue to make space for the new patch/multi-line being added.

.. raw:: html

    <img src="https://docs.bokeh.org/static/freehand_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing freehand drawing and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor, and key strokes by
showing the pressed keys. The ``PolyDrawTool`` can **Draw** and
**Delete** patches and multi-lines:

Draw patch/multi-line
  Click and drag to start drawing and release the mouse button to
  finish drawing.

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

The ``PointDrawTool()`` allows you to add, drag, and delete point-like
glyphs (of ``XYGlyph`` type) on one or more renderers by editing the
underlying ``ColumnDataSource`` data. Like other drawing tools,
you must pass the renderers to be edited as a list:

.. code-block:: python

    c1 = p.circle('x', 'y', 'width', 'height', source=source)
    r1 = p.rect('x', 'y', 0.1, 0.1, source=source2)
    tool = PointDrawTool(renderers=[c1, r1])

The tool automatically modifies the columns on the data source
corresponding to the ``x`` and ``y`` values of the glyph. Any
additional columns in the data source will be padded in accordance
to :ref:`ug_interaction_tools_default_values` procedure when adding
a new point. Any newly added points will be inserted in the
``ColumnDataSource`` of the first supplied renderer.

It is also often useful to limit the number of elements that can be
drawn. Using the ``num_objects`` property, you can ensure that once the
limit has been reached, the oldest point will be popped off the queue
to make space for the new point being added.

.. raw:: html

    <img src="https://docs.bokeh.org/static/point_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing point draw, drag, select, and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor, and key strokes by
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

.. bokeh-plot:: __REPO__/examples/interaction/tools/point_draw.py
    :source-position: none


PolyDrawTool
~~~~~~~~~~~~

* name: ``'poly_draw'``
* menu icon: |poly_draw_icon|

The ``PolyDrawTool()`` allows you to draw, select, and delete
``Patches`` and ``MultiLine`` glyphs on one or more renderers by
editing the underlying ``ColumnDataSource`` data. Like other drawing tools,
you must pass the renderers to be edited as a list.

The tool automatically modifies the columns on the data source
corresponding to the ``xs`` and ``ys`` values of the glyph. Any
additional columns in the data source will be padded in accordance
to :ref:`ug_interaction_tools_default_values` procedure when adding
a new point. Any newly added patch or multi-line will be inserted in
the ``ColumnDataSource`` of the first supplied renderer.

It is also often useful to limit the number of elements that can be
drawn. For example, when specifying a specific number of regions of interest.
Using the ``num_objects`` property, you can ensure that once the limit
has been reached the oldest patch/multi-line will be popped off the
queue to make space for the new patch/multi-line being added.

If a ``vertex_renderer`` with a point-like glyph is supplied, the
PolyDrawTool will use it to display the vertices of the
multi-lines/patches on all supplied renderers. This also enables the
ability to snap to existing vertices while drawing.

.. raw:: html

    <img src="https://docs.bokeh.org/static/poly_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing polygon draw, select, and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor, and key strokes by
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

.. bokeh-plot:: __REPO__/examples/interaction/tools/poly_draw.py
    :source-position: none


PolyEditTool
~~~~~~~~~~~~~~

* name: ``'poly_edit'``
* menu icon: |poly_edit_icon|

The PolyEditTool() allows you to edit the vertices of one or more
``Patches`` or ``MultiLine`` glyphs. You can define the glyphs to be
edited with the ``renderers`` property. You can define the renderer
for the vertices with the ``vertex_renderer``. It must
render a point-like Glyph (of ``XYGlyph`` type).

The tool automatically modifies the columns on the data source
corresponding to the ``xs`` and ``ys`` values of the glyph. Any
additional columns in the data source will be padded in accordance
to :ref:`ug_interaction_tools_default_values` procedure when adding
a new point.

.. raw:: html

    <img src="https://docs.bokeh.org/static/poly_edit_keyboard_optimized.gif"
     width='400px' alt="Animation showing polygon and vertex drag, select, and delete actions">

The animation above shows the supported tool actions, highlighting
mouse actions with a circle around the cursor, and key strokes by
showing the pressed keys. The ``PolyEditTool`` can **Add**, **Move**,
and **Delete** vertices on existing patches and multi-lines:

Show vertices
  Double tap an existing patch or multi-line.

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

.. bokeh-plot:: __REPO__/examples/interaction/tools/poly_edit.py
    :source-position: none


.. _ug_interaction_tools_lod:

Controlling level of detail
---------------------------

Although the HTML canvas can comfortably display tens or even hundreds of
thousands of glyphs, doing so can have adverse effects on interactive
performance. In order to accommodate large data sizes, Bokeh plots offer
"Level of Detail" (LOD) capability in the client.

.. note::
    Another option when dealing with very large data volumes is to use the
    Bokeh Server to perform downsampling on data before it is sent to the
    browser. Such an approach is unavoidable past a certain data size. See
    :ref:`ug_server` for more information.

To maintain performance while handling large data sizes, the plot only draws
a small fraction of data points during interactive operations (panning
or zooming, for example). There are four properties on |Plot| objects that
control LOD behavior:

.. bokeh-prop:: Plot.lod_factor
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_interval
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_threshold
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_timeout
    :module: bokeh.models.plots


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
