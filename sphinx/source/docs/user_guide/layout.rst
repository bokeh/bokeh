.. _userguide_layout:

Laying out Plots and Widgets
============================

Bokeh includes several layout options for arranging plots and widgets. They make
it possible to arrange multiple components to create interactive dashboards or
data applications.

The layout functions let you build a grid of plots and widgets. You can nest as
many rows, columns, or grids of plots together as you'd like. In addition, Bokeh
layouts support a number of "sizing modes". These sizing modes allow plots and
widgets to resize based on the browser window.

.. _userguide_layout_layouts:

Basic Layouts
-------------

Column Layout
~~~~~~~~~~~~~

To display plots or widgets in a vertical fashion, use the |column| function:

.. bokeh-plot:: docs/user_guide/examples/layout_vertical.py
    :source-position: above

Row Layout
~~~~~~~~~~

To display plots horizontally, use the |row| function.

.. bokeh-plot:: docs/user_guide/examples/layout_horizontal.py
    :source-position: above

Grids Layout for Plots
~~~~~~~~~~~~~~~~~~~~~~

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

    gridplot([s1, s2, s3], ncols=2)

In addition, you can pass in ``plot_width`` and ``plot_height`` arguments,
and these will be used to set the size of all your plots.

By default, ``gridplot`` will merge all tools within each child plot
to a single toolbar attached to the grid. To disable this behavior,
you can set the option ``merge_tools`` to ``False``.

.. bokeh-plot:: docs/user_guide/examples/layout_grid_convenient.py
    :source-position: above

General Grid Layout
~~~~~~~~~~~~~~~~~~~

The |layout| function can be used to arrange both plots and widgets in a grid,
generating the necessary |row| and |column| layouts automatically. This allows
for quickly spelling a layouts like this:

.. code-block:: python

    sliders = column(amp, freq, phase, offset)

    layout([
        [bollinger],
        [sliders, plot],
        [p1, p2, p3],
    ])


Which produces the following layout:

.. image:: /_images/dashboard.png
    :width: 500px
    :height: 397px

|

The full code for this plot is available at
:bokeh-tree:`examples/howto/layouts/dashboard.py` in the project GitHub
repository.

.. _userguide_layout_sizing_mode:

Sizing Mode
-----------

Modes
~~~~~


Single Object
~~~~~~~~~~~~~

The example below allows you to select a sizing mode from a dropdown to see
how a single plot responds to different modes:

.. bokeh-plot:: docs/user_guide/examples/layout_sizing_mode.py
    :source-position: none

.. note::
    If the enclosing DOM element does not define any specific height to fill,
    sizing modes that scale or stretch to height may shrink to a minimum size.

Mulitple Objects
~~~~~~~~~~~~~~~~

.. bokeh-plot:: docs/user_guide/examples/layout_sizing_mode_multiple.py
    :source-position: none

.. _userguide_layout_limits:

Limitations
-----------

The Bokeh layout system is not a completely generic, general purpose layout
engine. It is intentionally sacrifices some capability in order to make common
use cases and scenarios simple to express. Extremely nested layouts with
many different sizing modes may yield undesirable results. For such cases it
is recommended to use the methods in :ref:`userguide_embed` along with your own
custom templates.

.. |column|    replace:: :func:`~bokeh.layouts.column`
.. |gridplot|  replace:: :func:`~bokeh.layouts.gridplot`
.. |layout|    replace:: :func:`~bokeh.layouts.layout`
.. |row|       replace:: :func:`~bokeh.layouts.row`
