:notoc:

.. _plot_reader_guide:

Plot reader guide
#################

This guide is intended for reading, interpreting, and interacting with a Bokeh plot.

To learn how to add and configure these tools in your own plots, see
:ref:`ug_interaction_tools` in the user guide.

.. _plot_reader_guide_tools:

Plot tools
----------

Bokeh plots offer several ways to interact with them. The most common are the plot tools.
These tools are located in the toolbar, usually on the right side of the plot,
though the plot creator can move or hide it.
Click a tool to activate it, and then use it to interact with the plot.
The following tools are available in Bokeh, and ``pan``, ``wheel_zoom``, ``auto_box_zoom``, ``save``, ``reset``, and ``help`` are enabled by default.

Tools that show a small chevron next to their icon have a menu with extra options.
Long-press the tool (or focus it and press Space) to open the menu.

.. _plot_reader_guide_navigation:

Navigation tools
~~~~~~~~~~~~~~~~

.. list-table::
   :header-rows: 1

   * - Icon
     - Name
     - Interaction
     - Expected behavior

   * - |pan_icon|
     - Pan tool
     - Click and drag to pan the plot. Variations include ``xpan`` and ``ypan``, which restrict panning to the x or y direction respectively.
     - The plot moves in the direction of the drag.

   * - |pan_left_icon|
     - Click pan tool
     - Click to move the view by a fixed step (10% of the plot size by default). The tool comes in the variations ``pan_left``, ``pan_right``, ``pan_up``, and ``pan_down``.
     - The plot moves one step in the direction shown on the tool's icon.

   * - |auto_box_zoom_icon|
     - Box zoom tool
     - Click and drag to draw a box around the area to zoom in. In the default ``auto_box_zoom`` mode, a mostly horizontal drag zooms only the x direction, a mostly vertical drag zooms only the y direction, and any other drag zooms both. Variations include ``box_zoom`` (always both directions), ``xbox_zoom``, and ``ybox_zoom``.
     - The plot zooms in to the area defined by the box.

   * - |wheel_zoom_icon|
     - Wheel zoom tool
     - Use the mouse wheel (scroll) to zoom in and out of the plot, centered on the mouse cursor position. Variations include ``xwheel_zoom`` and ``ywheel_zoom``, which restrict zooming to the x or y direction respectively. If the plot creator requires a modifier key, the plot shows a message such as "use Ctrl + scroll to zoom".
     - The plot zooms in or out based on the scroll direction, centered on the mouse cursor position.

   * - |wheel_pan_icon|
     - Wheel pan tool
     - Use the mouse wheel (scroll) to pan the plot. The tool comes in two variations, ``xwheel_pan`` and ``ywheel_pan``, which pan in the x or y direction respectively. The tool's tooltip in the toolbar indicates the pan direction.
     - The plot moves horizontally or vertically on scroll.

   * - |zoom_in_icon|
     - Zoom in tool
     - Click to zoom in on the plot by a fixed step (10% by default). Variations include ``xzoom_in`` and ``yzoom_in``, which restrict zooming to the x or y direction respectively.
     - The plot zooms in by one step, centered on the plot's center. If a variation is used, it zooms in only in the specified direction.

   * - |zoom_out_icon|
     - Zoom out tool
     - Click to zoom out on the plot by a fixed step (10% by default). Variations include ``xzoom_out`` and ``yzoom_out``, which restrict zooming to the x or y direction respectively.
     - The plot zooms out by one step, centered on the plot's center. If a variation is used, it zooms out only in the specified direction.

.. _plot_reader_guide_selection:

Selection tools
~~~~~~~~~~~~~~~

All selection tools share the same keyboard modifiers: hold Shift to add to the
current selection, Ctrl to intersect with it, or Shift+Ctrl to subtract from it.
Press the Escape key to clear the selection.

.. list-table::
   :header-rows: 1

   * - Icon
     - Name
     - Interaction
     - Expected behavior

   * - |box_select_icon|
     - Box select tool
     - Click and drag to draw a box around the area to select. Variations include ``xbox_select`` and ``ybox_select``, which restrict the box to the x or y direction respectively.
     - The selected area is highlighted (un-selected areas are dimmed), and the data points within the box are selected for further actions defined by the plot creator.

   * - |lasso_select_icon|
     - Lasso select tool
     - Click and drag to draw a lasso around the area to select.
     - The selected area is highlighted (un-selected areas are dimmed), and the data points within the lasso are selected for further actions defined by the plot creator.

   * - |poly_select_icon|
     - Poly select tool
     - Click (or tap on touch device) to add each vertex of a polygon around the area to select. Press Enter (or long-press) to finish the polygon and make the selection. Press the Escape key once to discard an unfinished polygon, and again to clear the selection.
     - The selected area is highlighted (un-selected areas are dimmed), and the data points within the polygon are selected for further actions defined by the plot creator.

   * - |tap_icon|
     - Tap tool
     - Select a single data point by clicking (or tapping on touch device) on the plot. The ``doubletap`` variation requires a double click (or double tap) instead.
     - The selected data point is highlighted (un-selected areas are dimmed), and any associated actions (like displaying a tooltip) are triggered.

   * - |tap_icon|
     - Click tool
     - Click (or tap on touch device) on a data point. This is a variation of the tap tool (``click``) that inspects data points instead of selecting them.
     - Any actions defined by the plot creator are triggered, but the selection doesn't change.

.. _plot_reader_guide_inspection:

Inspection tools
~~~~~~~~~~~~~~~~

Inspection tools are active by default. Click an inspection tool in the toolbar
to turn it off or back on. Several inspection tools can be active at the same time.

.. list-table::
   :header-rows: 1

   * - Icon
     - Name
     - Interaction
     - Expected behavior

   * - |hover_icon|
     - Hover tool
     - Move the mouse over data points to show a tooltip.
     - A tooltip appears showing information about the data point under the mouse cursor, such as its coordinates and any additional information defined by the plot creator.

   * - |crosshair_icon|
     - Crosshair tool
     - Move the mouse over the plot to show a crosshair (horizontal and vertical lines) that follows the mouse cursor position. Variations include ``xcrosshair`` and ``ycrosshair``, which show only one of the two lines.
     - The crosshair lines appear at the mouse cursor position, allowing you to see the x and/or y coordinates of the cursor.

.. _plot_reader_guide_actions:

Action tools
~~~~~~~~~~~~

Action tools perform an operation immediately when you click them.

.. list-table::
   :header-rows: 1

   * - Icon
     - Name
     - Interaction
     - Expected behavior

   * - |save_icon|
     - Save tool
     - Click to save the plot as an image. If the plot creator hasn't set a file name, you're asked to enter one. The tool's menu also has options to copy the image to the clipboard or open it in a new browser tab.
     - The plot is saved as an image file (usually PNG) with the specified file name.

   * - |copy_icon|
     - Copy tool
     - Click to copy the plot as an image to the clipboard.
     - The image can be pasted into other applications. This requires a browser that supports copying images to the clipboard.

   * - |reset_icon|
     - Reset tool
     - Click to reset the plot to its original state.
     - The plot returns to the initial view, removing any zoom, pan, select, etc. actions done using plot tools. The undo history is also cleared.

   * - |undo_icon|
     - Undo tool
     - Click to undo the last action performed on the plot.
     - The last action (like selection, zoom, etc.) is reverted. The tool is disabled when there is nothing to undo.

   * - |redo_icon|
     - Redo tool
     - Click to redo the last undone action (using the Undo tool) on the plot.
     - The last undone action is reapplied. The tool is disabled when there is nothing to redo.

   * - |fullscreen_icon|
     - Fullscreen tool
     - Click to toggle the plot into fullscreen mode, and back to default mode.
     - The plot expands to fill the entire browser window, hiding other elements of the page. Clicking the tool again exits fullscreen mode.

   * - |settings_icon|
     - Examine tool
     - Click on the tool to open a dialog window with information about the plot objects.
     - A dialog window appears showing all plot objects and their property values. You can filter the objects and properties by typing in the text fields.

   * - |help_icon|
     - Help tool
     - Click to open the plot tools documentation page.
     - The plot tools documentation (or another page chosen by the plot creator) opens in a new browser tab.

.. _plot_reader_guide_edit:

Editing tools
~~~~~~~~~~~~~

Some plots let you draw and edit glyphs directly. All editing tools share a
small number of key bindings:

Shift
  Modifier key to add to selection or start drawing

Backspace
  Deletes the selected glyphs

Escape
  Clears the selection

.. note::
   On MacBooks and some other keyboards, the Backspace key is labeled
   "delete".

The animations below show the supported actions for each tool. Mouse actions
are highlighted with a circle around the cursor, and key strokes are shown as
the pressed keys.

.. _plot_reader_guide_box_edit:

|box_edit_icon| Box edit tool
'''''''''''''''''''''''''''''

.. raw:: html

    <img src="https://docs.bokeh.org/static/box_edit_keyboard_optimized.gif"
     width='400px' alt="Animation showing box draw, select, and delete actions">

Add box
  Hold Shift, then click and drag anywhere on the plot, or long-press
  once to start drawing. Move the mouse and long-press again to
  finish drawing.

Move box
  Click and drag an existing box. The box is dropped once you let
  go of the mouse button.

Delete box
  Tap a box to select it, then press the Backspace key while the mouse is
  within the plot area.

Move selection
  Select box(es) with Shift+tap (or another selection tool), then drag
  anywhere on the plot. Selecting and then dragging on a specific box
  moves all selected boxes.

Delete selection
  Select box(es) with Shift+tap (or another selection tool), then press
  Backspace while the mouse is within the plot area.

.. _plot_reader_guide_freehand_draw:

|freehand_draw_icon| Freehand draw tool
'''''''''''''''''''''''''''''''''''''''

.. raw:: html

    <img src="https://docs.bokeh.org/static/freehand_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing freehand drawing and delete actions">

Draw patch/multi-line
  Click and drag to start drawing, and release the mouse button to
  finish drawing.

Delete patch/multi-line
  Tap a line or patch to select it, then press the Backspace key while the
  mouse is within the plot area.

Delete selection
  Select patches/lines with Shift+tap (or another selection tool), then
  press Backspace while the mouse is within the plot area.

.. _plot_reader_guide_point_draw:

|point_draw_icon| Point draw tool
'''''''''''''''''''''''''''''''''

.. raw:: html

    <img src="https://docs.bokeh.org/static/point_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing point draw, drag, select, and delete actions">

Add point
  Tap anywhere on the plot.

Move point
  Tap and drag an existing point. The point is dropped once
  you let go of the mouse button.

Delete point
  Tap a point to select it, then press the Backspace key while the mouse is
  within the plot area.

Move selection
  Select point(s) with Shift+tap (or another selection tool), then drag
  anywhere on the plot. Selecting and then dragging a specific point
  moves all selected points.

Delete selection
  Select point(s) with Shift+tap (or another selection tool), then
  press Backspace while the mouse is within the plot area.

.. _plot_reader_guide_poly_draw:

|poly_draw_icon| Poly draw tool
'''''''''''''''''''''''''''''''

.. raw:: html

    <img src="https://docs.bokeh.org/static/poly_draw_keyboard_optimized.gif"
     width='400px' alt="Animation showing polygon draw, select, and delete actions">

Add patch/multi-line
  Long-press to add the first vertex, then tap to add each
  subsequent vertex. To finish drawing, long-press to insert
  the final vertex, or press the Escape key.

Move patch/multi-line
  Tap and drag an existing patch/multi-line. It is dropped
  once you let go of the mouse button.

Delete patch/multi-line
  Tap a patch/multi-line to select it, then press the Backspace key while
  the mouse is within the plot area.

.. _plot_reader_guide_poly_edit:

|poly_edit_icon| Poly edit tool
'''''''''''''''''''''''''''''''

.. raw:: html

    <img src="https://docs.bokeh.org/static/poly_edit_keyboard_optimized.gif"
     width='400px' alt="Animation showing polygon and vertex drag, select, and delete actions">

Show vertices
  Long-press an existing patch or multi-line.

Add vertex
  Long-press an existing vertex to select it. The tool draws the
  next point. To add it, tap in a new location. To finish editing
  and add a point, long-press. Otherwise, press the Escape key to cancel.

Move vertex
  Drag an existing vertex and let go of the mouse button to release
  it.

Delete vertex
  After selecting one or more vertices, press Backspace while the mouse
  cursor is within the plot area.

Linked plots
------------

Sometimes multiple plots are linked together with a shared toolbar and tool actions.

Example:

.. bokeh-plot:: __REPO__/examples/interaction/linking/linked_brushing.py
    :source-position: none

Widgets
-------

Bokeh plots and applications can have widgets that allow you to interact with the plot in various ways.
Common widgets include sliders, dropdowns, checkboxes, buttons, and input fields.
Check out the full list of widgets in the :ref:`ug_interaction_widgets` page.

Interactive legend
------------------

Bokeh plots can have an interactive legend that allows you to toggle the visibility of glyphs in the plot.

Click on the legend items to toggle the visibility (mute or hide) of the corresponding glyphs.

Example:

.. bokeh-plot:: __REPO__/examples/interaction/legends/legend_mute.py
    :source-position: none

.. include:: includes/tool_icons.rst
