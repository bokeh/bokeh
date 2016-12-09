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
parameter to the |figure| function or to any |bokeh.charts| Chart function.
Valid values are:

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
``Plot`` subclass, such as ``Figure`` or ``Chart``.

Tools can be specified by passing the ``tools`` parameter to the |figure|
function or to any |bokeh.charts| Chart function. The tools parameter
accepts a list of tool objects, for instance:

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
``active_scroll``, and ``active_tap`` properties of ``Toolbar``. These
properties can take the following values:

* ``None`` --- there is no active tool of this kind
* ``"auto"`` --- Bokeh chooses a tool of this kind to be active (possibly none)
* a ``Tool`` instance --- Bokeh sets the given tool to be the active tool

As an example:

.. code-block:: python

    # configure so that no drag tools are active
    plot.toolbar.active_drag = None

    # configure so that Bokeh chooses what (if any) scroll tool is active
    plot.toolbar.active_scroll = "auto"

    # configure so that a specific PolySelect tap tool is active
    plot.toolbar.active_tap = poly_select

The default value for all of these properties is ``"auto"``.

Active tools can be specified by passing the these properties as keyword
arguments to the |figure| function or to any |bokeh.charts| Chart function.
In this case, it is also possible to pass any one of the string names for,
ease of configuration:

.. code-block:: python

    # configures the lasso tool to be active
    plot = figure(tools="pan,lasso_select,box_select", active_drag="lasso_select")

.. _userguide_tools_builtin_tools:

Built-in Tools
--------------

.. _userguide_tools_pandrag:

Pan/Drag Tools
~~~~~~~~~~~~~~

These tools are employed by panning (on touch devices) or left-dragging (on
mouse devices). Only one pan/drag tool may be active at a time. Where
applicable, Pan/Drag tools will respect any max and min values set on ranges.

BoxSelectTool
'''''''''''''

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
'''''''''''

* name: ``'box_zoom'``
* icon: |box_zoom_icon|

The box zoom tool allows the user to define a rectangular region to zoom the
plot bounds too, by left-dragging a mouse, or dragging a finger across the
plot area.

LassoSelectTool
'''''''''''''''

* name: ``'lasso_select'``
* icon: |lasso_select_icon|

The lasso selection tool allows the user to define an arbitrary region for
selection by left-dragging a mouse, or dragging a finger across the plot area.

.. note::
    To make a multiple selection, press the SHIFT key. To clear the selection,
    press the ESC key.

PanTool
'''''''

* name: ``'pan'``, ``'xpan'``, ``'ypan'``,
* icon: |pan_icon|

The pan tool allows the user to pan the plot by left-dragging a mouse or dragging a
finger across the plot region.

It is also possible to constrain the pan tool to only act on either just the x-axis or
just the y-axis by setting the ``dimensions`` property to a list containing ``width``
or ``height``. Additionally, there are tool aliases ``'xpan'`` and ``'ypan'``,
respectively.

ResizeTool
''''''''''

* name: ``'resize'``
* icon: |resize_icon|

The resize tool allows the user to left-drag a mouse or drag a finger to resize
the entire plot.

.. _userguide_tools_clicktap:

Click/Tap Tools
~~~~~~~~~~~~~~~

These tools are employed by tapping (on touch devices) or left-clicking (on
mouse devices). Only one click/tap tool may be active at a time.

PolySelectTool
''''''''''''''

* name: ``'poly_select'``
* icon: |poly_select_icon|

The polygon selection tool allows the user to define an arbitrary polygonal
region for selection by left-clicking a mouse, or tapping a finger at different
locations.

.. note::
    Complete the selection by making a double left-click or tapping. To make a
    multiple selection, press the SHIFT key. To clear the selection, press the
    ESC key.

TapSelectTool
'''''''''''''

* name: ``'tap'``
* icon: |tap_select_icon|

The tap selection tool allows the user to select at single points by clicking
a left mouse button, or tapping with a finger.

.. note::
    To make a multiple selection, press the SHIFT key. To clear the selection,
    press the ESC key.

.. _userguide_tools_scrollpinch:

Scroll/Pinch Tools
~~~~~~~~~~~~~~~~~~

These tools are employed by pinching (on touch devices) or scrolling (on
mouse devices). Only one scroll/pinch tool may be active at a time.

WheelZoomTool
'''''''''''''

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
'''''''''''''

* name: ``'xwheel_pan'``, ``'ywheel_pan'``
* icon: |wheel_pan_icon|

The wheel pan tool will translate the plot window along the specified
dimension without changing the window's aspect ratio. The tool will respect any
min and max values and ranges preventing panning beyond these values.

.. _userguide_tools_actions:

Actions
~~~~~~~

Actions are operations that are activated only when their button in the toolbar
is tapped or clicked. They are typically modal or immediate-acting.

UndoTool
'''''''''

* name: ``'undo'``
* icon: |undo_icon|

The undo tool allows to restore previous state of the plot.

RedoTool
'''''''''

* name: ``'redo'``
* icon: |redo_icon|

The redo tool reverses the last action performed by undo tool.

ResetTool
'''''''''

* name: ``'reset'``
* icon: |reset_icon|

The reset tool will restore the plot ranges to their original values.

SaveTool
''''''''

* name: ``'save'``
* icon: |save_icon|

The save tool pops up a modal dialog that allows the user to save a PNG image
of the plot.

ZoomInTool
''''''''''

* name: ``'zoom_in'``, ``'xzoom_in'``, ``'yzoom_in'``
* icon: |zoom_in_icon|

The zoom-in tool will increase the zoom of the plot. It will respect any min and max
values and ranges preventing zooming in and out beyond these.

It is also possible to constraint the wheel zoom tool to only act on either
just the x-axis or just the y-axis by setting the ``dimensions`` property to
a list containing ``width`` or ``height``. Additionally, there are tool aliases
``'xzoom_in'`` and ``'yzoom_in'``, respectively.

ZoomOutTool
'''''''''''

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
~~~~~~~~~~

Inspectors are passive tools that annotate or otherwise report information about
the plot, based on the current cursor position. Any number of inspectors may be
active at any given time. The inspectors menu in the toolbar allows users to
toggle the active state of any inspector.

CrosshairTool
'''''''''''''

* name: ``'crosshair'``
* menu icon: |crosshair_icon|

Th crosshair tool draws a crosshair annotation over the plot, centered on
the current mouse position. The crosshair tool may be configured to draw
across only one dimension by setting the ``dimensions`` property to a
list containing ``width`` or ``height``.

HoverTool
'''''''''

* name: ``'hover'``
* menu icon: |hover_icon|

The hover tool pops up a tooltip div whenever the cursor is over a glyph.
The information comes from the glyphs data source and is configurable through
a simple tooltips dictionary that maps displayed names to columns in the data source,
or to special known variables

----

Below is some code that shows how to specify which tools to add to the
toolbar.

Try running the code and changing the name of tools being added to the
tools with valid values

.. bokeh-plot:: docs/user_guide/examples/tools_hover_string.py
    :source-position: above

or with a list of the tool instances:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_instance.py
    :source-position: above

Setting Tool Visuals
--------------------

Hover Tool
~~~~~~~~~~

The hover tool is a passive inspector tool. It is generally on at all times,
but can be configured in the inspector’s menu associated with the toolbar.

The hover tool displays informational tooltips whenever the cursor is directly
over a glyph. The data to show comes from the glyph’s data source, and what is
to be displayed is configurable through a tooltips attribute that maps display
names to columns in the data source, or to special known variables.

Field names starting with “@” are interpreted as columns on the data source.
Field names starting with “$” are special, known fields, e.g. `$x` will
display the x-coordinate under the current mouse position. More information
about those fields can be found in the |HoverTool| reference.

Basic Tooltips
''''''''''''''

The hover tool will generate a default "tabular" tooltip of field names
and their associated values. These field names and values are supplied
as a list of *(field name, value)* tuples. For instance, the tooltip
list below on the left will produce the basic default tooltip below on
the right:

|

+-----------------------------------------------------------+--------------------+
|::                                                         |                    |
|                                                           |                    |
|    hover.tooltips = [                                     |                    |
|        ("index", "$index"),                               |                    |
|        ("(x,y)", "($x, $y)"),                             |                    |
|        ("radius", "@radius"),                             |   |hover_basic|    |
|        ("fill color", "$color[hex, swatch]:fill_color"),  |                    |
|        ("foo", "@foo"),                                   |                    |
|        ("bar", "@bar"),                                   |                    |
|    ]                                                      |                    |
+-----------------------------------------------------------+--------------------+

Here is a complete example of how to configure and use the hover tool with
default tooltip:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_tooltips.py
    :source-position: above


.. _custom_hover_tooltip:

Custom Tooltip
''''''''''''''

It is also possible to supply a custom tooltip template. To do this,
pass an HTML string, with the Bokeh tooltip field name symbols wherever
substitutions are desired. You can use the ``{safe}`` tag after the column
name to disable the escaping of HTML in the data source. An example is shown below:

.. bokeh-plot:: docs/user_guide/examples/tools_hover_custom_tooltip.py
    :source-position: above

Selection Overlays
~~~~~~~~~~~~~~~~~~

Selection Overlays can also be configured.  See the :ref:`userguide_styling_tool_overlays` section
for more information.


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

The basic idea is that during interactive operations (e.g., panning or zooming),
the plot only draws some small fraction of data points. This hopefully allows the
general sense of the interaction to be preserved mid-flight, while maintaining
interactive performance. There are four properties on |Plot| objects that control
LOD behavior:

.. bokeh-prop:: Plot.lod_factor
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_interval
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_threshold
    :module: bokeh.models.plots

.. bokeh-prop:: Plot.lod_timeout
    :module: bokeh.models.plots


.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |HoverTool| replace:: :class:`~bokeh.models.tools.HoverTool`

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
.. |resize_icon| image:: /_images/icons/Resize.png
    :height: 14pt
.. |save_icon| image:: /_images/icons/Save.png
    :height: 14pt
.. |tap_select_icon| image:: /_images/icons/TapSelect.png
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
