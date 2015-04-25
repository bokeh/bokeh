.. _userguide_tools:

Configuring Plot Tools
======================

.. contents::
    :local:
    :depth: 2

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

``"above"``

``"below"``

``"left"``

``"right"``

If you would like to hide the toolbar entirely, pass ``None``.

Below is some code that positions the toolbar below the plot. Try
running the code and changing the ``toolbar_position`` value.

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("toolbar.html")

    # create a new plot with the toolbar below
    p = figure(plot_width=400, plot_height=400,
               title=None, toolbar_location="below")

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

.. _userguide_tools_specifying_tools:

Specifying Tools
----------------

Tools can be specified by passing the ``tools`` parameter to the |figure|
function or to any |bokeh.charts| Chart function. The tools parameter
accepts a list of tool objects, for instance:

.. code-block:: python

    tools = [BoxZoomTool(), ResetTool()]

Tools can also be supplied conveniently with a comma-separate string
containing tool shortcut names:

.. code-block:: python

    tools = "pan,wheel_zoom,box_zoom,reset,resize"

.. _userguide_tools_pandrag:

Pan/Drag Tools
~~~~~~~~~~~~~~

These tools are employed by panning (on touch devices) or left-dragging (on
mouse devices). Only one pan/drag tool may be active at a time.

BoxSelectTool
'''''''''''''

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
'''''''''''

* name: ``'box_zoom'``
* icon: |box_zoom_icon|

The box zoom tool allows the user to degine a rectangular region to zoom the
plot bounds too, by left-dragging a mouse, or dragging a finger across the
plot area.

LassoSelectTool
'''''''''''''''

* name: ``'lasso_select'``
* icon: |lasso_select_icon|

The lasso selection tool allows the user to define an arbitrary region for
selection by left-dragging a mouse, or dragging a finger across the plot area.

.. note::
    To make a multiple selection, you have to press the SHIFT key and
    to clear the selection you have to press ESC key.

PanTool
'''''''

* name: ``'pan'``, ``'xpan'``, ``'ypan'``,
* icon: |pan_icon|

The pan tool allows the user to pan the plot by left-dragging a mouse or dragging a
finger across the plot region.

It is also possible to constraint the pan tool to only act on either just the x-axis or
just the y-axis by setting the ``dimension`` property to ``width`` or ``height``.
Additionally, there are tool aliases ``'xpan'`` and ``'ypan'``, respectively.

ResizeTool
''''''''''

* name: ``'resize_select'``
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
regions for selection by left-clicking a mouse, or tapping a finger at different
locations.

.. note::
    To complete the selection, you have to make a double left-click or tapping
    Also, to make a multiple selection, you have to press the SHIFT key and
    to clear the selection you have to press ESC key.

TapSelectTool
'''''''''''''

* name: ``'tap_select'``
* icon: |tap_select_icon|

The tap selection tool allows the user to select at single points by clicking
a left mouse button, or tapping with a finger.

.. note::
    To make a multiple selection, you have to press the SHIFT key and
    to clear the selection you have to press ESC key.

.. _userguide_tools_scrollpinch:

Scroll/Pinch Tools
~~~~~~~~~~~~~~~~~~

These tools are employed by pinching (on touch devices) or scrolling (on
mouse devices). Only one scroll/pinch tool may be active at a time.

WheelZoomTool
'''''''''''''

* name: ``'wheel_zoom'``, ``'xwheel_zoom'``, ``'ywheel_zoom'``
* icon: |wheel_zoom_icon|

The wheel zoom tool will zoom the plot in and out, centered on the curren
t mouse location.

It is also possible to constraint the wheel zoom tool to only act on either
just the x-axis or just the y-axis by setting the ``dimension`` property to
``width`` or ``height``. Additionally, there are tool aliases ``'xwheel_zoom'``
and ``'ywheel_zoom'``, respectively.

.. _userguide_tools_actions:

Actions
~~~~~~~

Actions are operations that are activated only when their button in the toolbar
is tapped or clicked. They are typically modal or immediate-acting.

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

.. _userguide_tools_inspectors:

Inspectors
~~~~~~~~~~

* menu icon: |inspector_icon|

Inpectors are passive tools that annotate or otherwise report information about
the plot, based on the current cursor position. Any number of inspectors may be
active at any given time. The inspectors menu in the toolbar allows users to
toggle the active state of any inspector.

CrosshairTool
'''''''''''''

* name: ``'crosshair'``

Th crosshair tool draws a crosshair annotation over the plot, centered on
the current mouse position. The crosshair tool may be configured to draw
accross only one dimension by setting the ``dimension`` property to
``width`` or ``height``.

HoverTool
'''''''''

* name: ``'hover'``

The hover tool pops up a tooltip div whenever the cursor is over a glyph.
The information comes from the glyphs data source and is configurable through
a simple tooltips dictionary that maps displayed names to columns in the data source,
or to special known variables

----

Below is some code that shows how to specify which tools to add to the
toolbar.

Try running the code and changing the name of tools being added to the
tools with valid values

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show

    output_file("toolbar.html")

    TOOLS='box_zoom,box_select,crosshair,resize,reset'

    # create a new plot with the toolbar below
    p = figure(plot_width=400, plot_height=400, title=None, tools=TOOLS)

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

or with a list of the tool instances:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show
    from bokeh.models import HoverTool, BoxSelectTool

    output_file("toolbar.html")
    TOOLS=[BoxSelectTool(), HoverTool()]

    p = figure(plot_width=400, plot_height=400, title=None, tools=TOOLS)

    p.circle([1,2,3,4,5], [2,5,8,2,7], size=10)

    show(p)

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
Field names starting with “$” are special, known fields. More information
about those fields can be found in the ``HoverTool`` reference.

Here is an example of how to configure and use the hover tool:

.. bokeh-plot::
    :source-position: above

    from bokeh.plotting import figure, output_file, show, ColumnDataSource
    from bokeh.models import HoverTool
    from collections import OrderedDict

    output_file("toolbar.html")

    source = ColumnDataSource(
        data=dict(
            x=[1,2,3,4,5],
            y=[2,5,8,2,7],
            desc=['A', 'b', 'C', 'd', 'E'],
        )
    )

    TOOLS=[
        HoverTool(tooltips = OrderedDict(
            [
            ("index", "$index"),
            ("(x,y)", "($x, $y)"),
            ("desc", "@desc"),
            ]
        ))]

    # create a new plot with the toolbar below
    p = figure(plot_width=400, plot_height=400, title=None, tools=TOOLS)

    p.circle('x', 'y', size=10, source=source)

    show(p)

Overlay Tools
~~~~~~~~~~~~~

.. _userguide_tools_lod:

Controlling Level of Detail
---------------------------


.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`

.. |figure| replace:: :func:`~bokeh.plotting.figure`


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
