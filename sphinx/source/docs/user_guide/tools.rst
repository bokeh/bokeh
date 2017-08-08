.. _userguide_tools:

Configuring Plot Tools
======================

Bokeh comes with a number of interactive tools. There are three categories of tool
interactions:

* Gestures:

  - :ref:`userguide_tools_pandrag`
  - :ref:`userguide_tools_clicktap`
  - :ref:`userguide_tools_scrollpinch`

* :ref:`userguide_tools_actions`
* :ref:`userguide_tools_inspectors`

For each type of gesture, one tool can be active at any given time, and
the active tool is indicated on the toolbar by a highlight next to to the
tool icon. Actions are immediate or modal operations that are only activated
when their button in the toolbar is pressed. Inspectors are passive tools
that report information or annotate the plot in some way.

.. _userguide_tools_toolbar:

Positioning the Toolbar
-----------------------

By default, Bokeh plots come with a toolbar above the plot. In this section
you will learn how to specify a different location for the toolbar, or to
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

Note that the toolbar position clashes with the default axes, in this case
setting the ``toolbar_sticky`` option to ``False`` will move the toolbar
to outside of the region where the axis is drawn.

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

Tools can also be supplied conveniently with a comma-separate string
containing tool shortcut names:

.. code-block:: python

    tools = "pan,wheel_zoom,box_zoom,reset"

However, this method does not allow setting properties of the tools.

Finally, it is also always possible to add new tools to a plot by passing
a tool object to the ``add_tools`` method of a plot. This can also be done
in conjunction with the ``tools`` keyword described above:

.. code-block:: python

    plot = figure(tools="pan,wheel_zoom,box_zoom,reset")
    plot.add_tools(BoxSelectTool(dimensions=["width"]))

.. _userguide_tools_setting_active_tools:

Setting the Active Tools
------------------------

Bokeh toolbars can have (at most) one active tool from each kind of gesture
(drag, scroll, tap). By default, Bokeh will use a default pre-defined
order of preference to choose one of each kind from the set of configured
tools, to be active.

However it is possible to exert control over which tool is active. At the
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
setting the ``dimensions`` property to a list containing ``width`` or
``height``.

.. note::
    To make a multiple selection, press the SHIFT key. To clear the
    selection, press the ESC key.

BoxZoomTool
~~~~~~~~~~~

* name: ``'box_zoom'``
* icon: |box_zoom_icon|

The box zoom tool allows the user to define a rectangular region to zoom the
plot bounds too, by left-dragging a mouse, or dragging a finger across the
plot area.

LassoSelectTool
~~~~~~~~~~~~~~~

* name: ``'lasso_select'``
* icon: |lasso_select_icon|

The lasso selection tool allows the user to define an arbitrary region for
selection by left-dragging a mouse, or dragging a finger across the plot area.

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
mouse location. It will respect any min and max values and ranges preventing
zooming in and out beyond these.

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
min and max values and ranges preventing panning beyond these values.

.. _userguide_tools_actions:

Actions
-------

Actions are operations that are activated only when their button in the toolbar
is tapped or clicked. They are typically modal or immediate-acting.

UndoTool
~~~~~~~~

* name: ``'undo'``
* icon: |undo_icon|

The undo tool allows to restore previous state of the plot.

RedoTool
~~~~~~~~

* name: ``'redo'``
* icon: |redo_icon|

The redo tool reverses the last action performed by undo tool.

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
values and ranges preventing zooming in and out beyond these.

It is also possible to constraint the wheel zoom tool to only act on either
just the x-axis or just the y-axis by setting the ``dimensions`` property to
a list containing ``width`` or ``height``. Additionally, there are tool aliases
``'xzoom_in'`` and ``'yzoom_in'``, respectively.

ZoomOutTool
~~~~~~~~~~~

* name: ``'zoom_out'``, ``'xzoom_out'``, ``'yzoom_out'``
* icon: |zoom_out_icon|

The zoom-out tool will decrease the zoom level of the plot. It will respect any min and
max values and ranges preventing zooming in and out beyond these.

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

.. _basic_tooltips:

Basic Tooltips
''''''''''''''

By default, the hover tool will generate a "tabular" tooltip where each row
contains a label, and its associated value. The labels and values are supplied
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
``ColumnDataSource``. For instance the field name ``"@price"`` will display
values from the ``"price"`` column whenever a hover is triggered. If the hover
is for the 17th glyph, then the hover tooltip will correspondingly display
the 17th price value.

Note that if a column name contains spaces, the it must be supplied by
surrounding it in curly braces, e.g. ``@{adjusted close}`` will display values
from a column named ``"adjusted close"``.

Here is a complete example of how to configure and use the hover tool with
a default tooltip:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_tooltips.py
    :source-position: above

Hit-testing Behavior
''''''''''''''''''''

The hover tool displays informational tooltips associated with individual
glyphs. These tooltips can be configured to activate in in different ways
with a ``mode`` property:

:``"mouse"``:
    only when the mouse is directly over a glyph

:``"vline"``:
    whenever the a vertical line from the mouse position intersects a glyph

:``"hline"``:
    whenever the a horizontal line from the mouse position intersects a glyph

The default configuration is ``mode = "mouse"``. This can be observed in the
:ref:`basic_tooltips` example above. The example below in
:ref:`formatting_tooltip_fields` demonstrates an example that sets
``mode = "vline"``.

.. _formatting_tooltip_fields:

Formatting Tooltip Fields
'''''''''''''''''''''''''

By default, values for fields (e.g. ``@foo``) are displayed in a basic numeric
format. However it is possible to control the formatting of values more
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
tool. This property maps column names to format schemes. For example, to
use the ``"datetime"`` scheme for formatting a column ``"close date"``,
set the value:

.. code-block:: python

    hover_tool.formatters = { "close date": "datetime"}

If no formatter is specified for a column name, the default ``"numeral"``
formatter is assumed.

Note that format specifications are also compatible with column names that
have spaces. For example ```@{adjusted close}{($ 0.00 a)}`` applies a format
to a column named "adjusted close".

The example code below shows configuring a ``HoverTool`` with different
formatters for different fields:

.. code-block:: python

    HoverTool(
        tooltips=[
            ( 'date',   '@date{%F}'            ),
            ( 'close',  '$@{adj close}{%0.2f}' ), # use @{ } for field names with spaces
            ( 'volume', '@volume{0.00 a}'      ),
        ],

        formatters={
            'date'      : 'datetime', # use 'datetime' formatter for 'date' field
            'adj close' : 'printf',   # use 'printf' formatter for 'adj close' field
                                      # use default 'numeral' formatter for other fields
        },

        # display a tooltip whenever the cursor is vertically in line with a glyph
        mode='vline'
    )

You can see the output generated by this configuration by hovering the mouse
over the plot below:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_tooltip_formatting.py
    :source-position: none


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

.. _userguide_tools_lod:

Controlling Level of Detail
---------------------------

Although the HTML canvas can comfortably display tens or even hundreds of
thousands of glyphs, doing so can have adverse affects on interactive
performance. In order to accommodate large-ish (but not enormous) data
sizes, Bokeh plots offer "Level of Detail" (LOD) capability in the client.

.. note::
    Another option, when dealing with very large data volumes, is to use the
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

.. |NumeralTickFormatter| replace:: :class:`~bokeh.models.formatters.NumeralTickFormatter`
.. |DatetimeTickFormatter| replace:: :class:`~bokeh.models.formatters.DatetimeTickFormatter`
.. |PrintfTickFormatter| replace:: :class:`~bokeh.models.formatters.PrintfTickFormatter`

.. |hover_basic| image:: /_images/hover_basic.png

.. |box_select_icon| image:: /_images/icons/BoxSelect.png
    :height: 14pt
.. |box_zoom_icon| image:: /_images/icons/BoxZoom.png
    :height: 14pt
.. |help_icon| image:: /_images/icons/Help.png
    :height: 14pt
.. |crosshair_icon| image:: /_images/icons/Crosshair.png
    :height: 14pt
.. |hover_icon| image:: /_images/icons/Hover.png
    :height: 14pt
.. |lasso_select_icon| image:: /_images/icons/LassoSelect.png
    :height: 14pt
.. |pan_icon| image:: /_images/icons/Pan.png
    :height: 14pt
.. |poly_select_icon| image:: /_images/icons/PolygonSelect.png
    :height: 14pt
.. |redo_icon| image:: /_images/icons/Redo.png
    :height: 14pt
.. |reset_icon| image:: /_images/icons/Reset.png
    :height: 14pt
.. |save_icon| image:: /_images/icons/Save.png
    :height: 14pt
.. |tap_icon| image:: /_images/icons/Tap.png
    :height: 14pt
.. |undo_icon| image:: /_images/icons/Undo.png
    :height: 14pt
.. |wheel_pan_icon| image:: /_images/icons/WheelPan.png
    :height: 14pt
.. |wheel_zoom_icon| image:: /_images/icons/WheelZoom.png
    :height: 14pt
.. |zoom_in_icon| image:: /_images/icons/ZoomIn.png
    :height: 14pt
.. |zoom_out_icon| image:: /_images/icons/ZoomOut.png
    :height: 14pt
