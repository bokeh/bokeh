.. _userguide_layout:

Laying out plots and widgets
============================

Bokeh includes several layout options for arranging plots and widgets. They aim
to make it quick to create your interactive data applications. At the heart of
the layouts are three core objects Row, Column, and WidgetBox. While you can
use these models directly, we recommend using the layout functions |row|,
|column|, and |widgetbox|.

The layout functions let you build a grid of plots and widgets. You can nest as
many rows, columns, and plots together as you'd like. In addition, bokeh
layouts support a number of "sizing modes". These sizing modes allow plots and
widgets to resize based on the browser window.

There are two things to keep in mind for best results using layout: 

#. All items must have the same sizing mode 
#. Widgets must be inside a widget box

Consistent sizing mode: everything item in a layout must have the same sizing
mode for the layout to behave as expected. It is for this reason that we
recommend using the layout functions as they help ensure that all the children
of the row or column have the same sizing mode. We hope to lift this
restriction in future releases.

Widget boxes: Widgets are html objects like buttons, and dropdown menus. They
behave slightly differently to plots and and putting them in a widgetbox is
necessary so that they can all work together. In fact, if you try and put a
``Widget`` in ``Row`` or ``Column`` it will be automatically put into a
``WidgetBox``. As a result, it's a good idea to wrap your own widgets in a
``WidgetBox`` using |widgetbox| as then you can be sure about how your widgets
are getting arranged.


.. _userguide_layout_layout_vertical:

Column
------

To display plots or widgets in a vertical fashion, use the |column| function:

.. bokeh-plot:: source/docs/user_guide/source_examples/layout_vertical.py
    :source-position: above


.. _userguide_layout_layout_horizontal:

Row
---

To display plots horizontally, use the |row| function.

.. bokeh-plot:: source/docs/user_guide/source_examples/layout_horizontal.py
    :source-position: above


.. _userguide_layout_widgets:

Widgets
-------

Layout a group of widgets with the |widgetbox| function.

.. bokeh-plot:: source/docs/user_guide/source_examples/layout_widgets.py
    :source-position: above


.. _userguide_layout_layout_grid:

Grid of Plots
-------------

The |gridplot| function can be used to arrange
Bokeh Plots in grid layout. |gridplot| also collects all
tools into a single toolbar, and the currently active tool is the same
for all plots in the grid. It is possible to leave "empty" spaces in
the grid by passing ``None`` instead of a plot object.

.. bokeh-plot:: source/docs/user_guide/source_examples/layout_grid.py
    :source-position: above

For convenience you can also just pass a list of plots, and specify the number of columns
you want in your grid. So, ``gridplot([[s1, s2], [s3, None]])`` and
``gridplot([s1, s2, s3], ncols=2)`` are equivalent. In addition, you can pass in a
``plot_width`` and ``plot_height`` and this will set the size of all your plots.

.. note::

    You cannot use ``None`` with the ncols argument. It must only be a list of ``Plot``s.

.. bokeh-plot:: source/docs/user_guide/source_examples/layout_grid_convenient.py
    :source-position: above

.. _userguide_layout_layout

Grid Layout
-----------

The |layout| function can be used to arrange Plots and Widgets in a grid, it is
basically a convenience wrapper around |row| and |column|. Allowing you to quickly spell
a layout like this.

.. code-block:: python

  l = layout([
    [bollinger],
    [sliders, plot],
    [p1, p2, p3],
  ], sizing_mode='stretch_both')

Producing the following layout. The full code for this plot is `available in
the examples directory
<https://github.com/bokeh/bokeh/blob/0.12.0/examples/howto/layouts/dashboard.py>`_:

.. image:: /_images/dashboard.png
    :width: 500px
    :height: 397px


.. |column|    replace:: :func:`~bokeh.layouts.column`
.. |gridplot|  replace:: :func:`~bokeh.layouts.gridplot`
.. |layout|    replace:: :func:`~bokeh.layouts.layout`
.. |row|       replace:: :func:`~bokeh.layouts.row`
.. |widgetbox| replace:: :func:`~bokeh.layouts.widgetbox`
