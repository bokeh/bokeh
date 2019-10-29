.. _userguide_layout:

Laying out Plots and Widgets
============================

Bokeh includes several layout options for arranging plots and widgets. They aim
to make it quick to create your interactive data applications.

The layout functions let you build a grid of plots and widgets. You can nest as
many rows, columns, or grids of plots together as you'd like. In addition, Bokeh
layouts support a number of "sizing modes". These sizing modes allow plots and
widgets to resize based on the browser window.

.. _userguide_layout_layout_columns:

Columns
-------

To display plots or widgets in a vertical fashion, use the |column| function:

.. bokeh-plot:: docs/user_guide/examples/layout_vertical.py
    :source-position: above

.. _userguide_layout_layout_rows:

Rows
----

To display plots horizontally, use the |row| function.

.. bokeh-plot:: docs/user_guide/examples/layout_horizontal.py
    :source-position: above

.. _userguide_layout_layout_gridplot:

Grids Layout for Plots
----------------------

The |gridplot| function can be used to arrange
Bokeh Plots in grid layout. |gridplot| also collects all
tools into a single toolbar, and the currently active tool is the same
for all plots in the grid. It is possible to leave "empty" spaces in
the grid by passing ``None`` instead of a plot object.

.. bokeh-plot:: docs/user_guide/examples/layout_grid.py
    :source-position: above

For convenience you can also just pass a list of plots, and specify the
number of columns you want in your grid. For example,

.. code-block:: python

    gridplot([[s1, s2], [s3, None]])

and

.. code-block:: python

    gridplot([s1, s2, s3], ncols=2)

are equivalent. In addition, you can pass in ``plot_width`` and
``plot_height`` arguments, and this will set the size of all your plots.
By default, ``gridplot`` will merge all tools within each child plot
to a single toolbar attached to the grid. To disable this behavior,
you can set the option ``merge_tools`` to ``False``.


.. bokeh-plot:: docs/user_guide/examples/layout_grid_convenient.py
    :source-position: above

.. _userguide_layout_layout:

General Grid Layout
-------------------

The |layout| function can be used to arrange both Plots and Widgets in a grid,
generating the necessary |row| and |column| layouts automatically. This allows
for quickly spelling a layout like this:

.. code-block:: python

    l = layout([
        [bollinger],
        [sliders, plot],
        [p1, p2, p3],
    ], sizing_mode='stretch_both')

Which produces the following layout:

.. image:: /_images/dashboard.png
    :width: 500px
    :height: 397px

The full code for this plot is available at
:bokeh-tree:`examples/howto/layouts/dashboard.py` in the project GitHub
repository.

.. |column|    replace:: :func:`~bokeh.layouts.column`
.. |gridplot|  replace:: :func:`~bokeh.layouts.gridplot`
.. |layout|    replace:: :func:`~bokeh.layouts.layout`
.. |row|       replace:: :func:`~bokeh.layouts.row`
