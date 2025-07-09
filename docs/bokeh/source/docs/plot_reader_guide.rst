:notoc:

.. _plot_reader_guide:

Plot reader guide
#################

This guide is intended for reading, interpreting, and interacting with a Bokeh plot.

Plot tools
----------

Bokeh plots have several ways of interactions, most common are the plot tools.
These tools are typically located on the right side of the plot.
They can be clicked to activate and then used to interact with the plot.
The following tools are available in Bokeh, and the first six are enabled by default.

.. list-table:: Plot tools
   :header-rows: 1

   * - Icon
     - Name
     - Interaction
     - Expected behavior

   * - |pan_icon|
     - Pan tool
     - Click and drag to pan the plot. Variations include `xpan` and `ypan`, which restrict panning to the x or y direction respectively.
     - The plot moves in the direction of the drag.

   * - |box_zoom_icon|
     - Box zoom tool
     - Click and drag to draw a box around the area to zoom in.
     - The plot zooms in to the area defined by the box.

   * - |wheel_zoom_icon|
     - Wheel zoom tool
     - Use the mouse wheel (scroll) to zoom in and out.
     - The plot zooms in or out based on the scroll direction.

   * - |save_icon|
     - Save tool
     - Click to input a file name and save the plot as an image.
     - Plot is saved in PNG format with the specified file name.

   * - |reset_icon|
     - Reset tool
     - Click to reset the plot to its original state.
     - Plot returns to the initial view, removing any zoom, pan, select, etc. actions done using plot tools.

   * - |help_icon|
     - Help tool
     - Click to open the plot tools documentation page.
     - Plot tools documentation is displayed in the same browser tab.

   * - |box_select_icon|
     - Box select tool
     - Click and drag to draw a box around the area to select. Hold the Shift key to select multiple areas. Click the Escape key to clear the selection.
     - The selected area is highlighted (un-selected areas are dimmed), and the data points within the box are selected for further actions defined by the plot creator.

   * - |lasso_select_icon|
     - Lasso select tool
     - Click and drag to draw a lasso around the area to select. Hold the Shift key to select multiple areas. Click the Escape key to clear the selection.
     - The selected area is highlighted (un-selected areas are dimmed), and the data points within the box are selected for further actions defined by the plot creator.

   * - |poly_select_icon|
     - Poly select tool
     - Click (or tap on touch device) to create a polygon around the area to select. Hold the Shift key to select multiple areas. Click the Escape key to clear the selection.
     - The selected area is highlighted (un-selected areas are dimmed), and the data points within the polygon are selected for further actions defined by the plot creator.

   * - |tap_icon|
     - Tap tool
     - Select a single data point by clicking (or tapping on touch device) on the plot.
     - The selected data point is highlighted (un-selected areas are dimmed), and any associated actions (like displaying a tooltip) are triggered.

   * - |wheel_zoom_icon|
     - Wheel zoom tool
     - Use the mouse scroll to zoom in and out of the plot, centered on the mouse cursor position. Variations include `xwheel_zoom` and `ywheel_zoom`, which restrict zooming to the x or y direction respectively.
     - The plot zooms in or out based on the scroll direction, centered on the mouse cursor position.

   * - |wheel_pan_icon|
     - X (or) Y Wheel pan tool
     - Use the mouse scroll to pan the plot in the x or y direction. The hover message on the tool (in the toolbar) indicate pan direction.
     - The plot moves horizontally or vertically on scroll.

   * - examine_icon
     - Examine tool
     - Click on the tool to open a dialog window with information about the plot objects.
     - A dialog window appears showing all plot objects and their property values. You can filter the objects and properties by typing in the text fields.

   * - |undo_icon|
     - Undo tool
     - Click to undo the last action performed on the plot.
     - The last action (like selection, zoom, etc.) is reverted.

   * - |redo_icon|
     - Redo tool
     - Click to redo the last undone action (using the Undo tool) on the plot.
     - The last undone action is reapplied.

   * - fullscreen_icon
     - Fullscreen tool
     - Click to toggle the plot into fullscreen mode, and back to default mode.
     - The plot expands to fill the entire browser window, hiding other elements of the page. Clicking the tool again exits fullscreen mode.

   * - |zoom_in_icon|
     - ZoomIn tool
     - Click to zoom in on the plot by one unit. Variations include `xzoom_in` and `yzoom_in`, which restrict zooming to the x or y direction respectively.
     - The plot zooms in by one unit, centered on the plot's center. If a variation is used, it zooms in only in the specified direction.

   * - |zoom_out_icon|
     - ZoomOut tool
     - Click to zoom out on the plot by one unit. Variations include `xzoom_out` and `yzoom_out`, which restrict zooming to the x or y direction respectively.
     - The plot zooms out by one unit, centered on the plot's center. If a variation is used, it zooms in only in the specified direction.

   * - |crosshair_icon|
     - Crosshair tool
     - Click to activate a crosshair (horizontal and vertical lines) that follows the mouse cursor position. Variations include `x_crosshair` and `y_crosshair`, which restrict the crosshair to the x or y direction respectively.
     - The crosshair lines appear at the mouse cursor position, allowing you to see the x and/or y coordinates of the cursor.

   * - |hover_icon|
     - Hover tool
     - Click to activate a tooltip that appears when hovering on data points.
     - A tooltip appears showing information about the data point under the mouse cursor, such as its coordinates and any additional information defined by the plot creator.

Linked plots
============

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
.. .. |examine_icon| image:: /_images/icons/Examine.png
..     :height: 19px
.. .. |fullscreen_icon| image:: /_images/icons/Fullscreen.png
..     :height: 19px
