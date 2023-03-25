.. _ug_basic_layouts:

Grids and layouts
=================

Bokeh includes several layout options for plots and widgets. These let you
arrange multiple components to create interactive dashboards and data
applications.

Layout functions let you build a grid of plots and widgets. You can have as
many rows, columns, or grids of plots in one layout as you like. Bokeh
layouts also allow for a number of sizing options, or modes. These modes
allow plots and widgets to resize to fit the browser window.

.. _ug_basic_layouts_builtin:

Built-in layouts
----------------

Column layout
~~~~~~~~~~~~~

To display plots or widgets vertically, use the |column| function.

.. bokeh-plot:: __REPO__/examples/basic/layouts/vertical.py
    :source-position: above

Row layout
~~~~~~~~~~

To display plots or widgets horizontally, use the |row| function.

.. bokeh-plot:: __REPO__/examples/basic/layouts/horizontal.py
    :source-position: above

.. _ug_basic_layouts_gridplot:

Grid layout for plots
~~~~~~~~~~~~~~~~~~~~~~

Use the |gridplot| function to arrange Bokeh plots in a grid. This
function also merges all plot tools into a single toolbar. Each plot
in the grid then has the same active tool.

You can leave grid cells blank by passing ``None`` to them instead of
a plot object.

.. bokeh-plot:: __REPO__/examples/basic/layouts/grid.py
    :source-position: above

For convenience, you can also just pass a list of plots and specify the
number of columns you want in your grid. For example:

.. code-block:: python

    gridplot([s1, s2, s3], ncols=2)

You can also pass in ``width`` and ``height`` arguments.
These dimensions will then apply to all your plots.

By default, |gridplot| merges all child plot tools into a single
parent grid toolbar. To disable this behavior, set ``merge_tools``
to ``False``.

.. bokeh-plot:: __REPO__/examples/basic/layouts/grid_convenient.py
    :source-position: above

General grid layout
~~~~~~~~~~~~~~~~~~~

You can use the |layout| function to arrange plots and widgets into a grid.
This automatically generates appropriate |row| and |column| layouts saving
you time. Try the following code to see how this function works.

.. code-block:: python

    sliders = column(amp, freq, phase, offset)

    layout([
        [bollinger],
        [sliders, plot],
        [p1, p2, p3],
    ])


This produces the following layout:

.. image:: /_images/dashboard.png
    :width: 500px
    :height: 397px
    :alt: A gridplot with several various plots and widgets arranges in a rows and columns layout.

For complete code see :bokeh-tree:`examples/basic/layouts/dashboard.py`.

.. _ug_basic_layouts_sizing_mode:

Sizing modes
------------

Modes
~~~~~

Use the following sizing modes to configure how Bokeh objects behave in a layout:

``"fixed"``
    Component retains its width and height regardless of browser window size.

``"stretch_width"``
    Component resizes to fill available width but does not maintain any aspect
    ratio. Height depends on the component type and may fit its contents or be
    fixed.

``"stretch_height"``
    Component resizes to fill available height but does not maintain any aspect
    ratio. Width depends on the component type and may fit its contents or be
    fixed.

``"stretch_both"``
    Component resizes to fill available width and height but does not maintain
    any aspect ratio.

``"scale_width"``
    Component resizes to fill available width and maintains either original or
    specified aspect ratio.

``"scale_height"``
    Component resizes to fill available height and maintains either original or
    specified aspect ratio.

``"scale_both"``
    Component resizes to fill available width and height and maintains either
    original or specified aspect ratio.

Depending on the mode, you may also have to specify ``width`` and/or ``height``.
For example, you have to specify a fixed height when using the ``stretch_width``
mode.

Components such as |row| and |column| elements share their sizing mode with all
of their children that do not have their own explicit sizing mode.

Single object
~~~~~~~~~~~~~

The example below lets you select a sizing mode from a dropdown and see how
a single plot responds to different modes.

.. bokeh-plot:: __REPO__/examples/basic/layouts/sizing_mode.py
    :source-position: none

.. note::
    If the enclosing DOM element does not define any specific height to fill,
    sizing modes that scale or stretch to height may shrink your plot to a
    minimum size.

Multiple objects
~~~~~~~~~~~~~~~~

Below is a more sophisticated but fairly typical example of a nested layout.

.. bokeh-plot:: __REPO__/examples/basic/layouts/sizing_mode_multiple.py
    :source-position: none

Here the layout includes sub-components with different sizing modes as follows:

.. code-block:: python

    # plot scales to original aspect ratio based on available width
    plot = figure(..., sizing_mode="scale_width")

    # slider fills all space available to it
    amp = Slider(..., sizing_mode="stretch_both")

    # fixed sized for the entire column
    widgets = column(..., sizing_mode="fixed", height=250, width=150)

    # heading fills available width
    heading = Div(..., height=80, sizing_mode="stretch_width")

    # entire layout fills all space available to it
    layout = column(heading, row(widgets, plot), sizing_mode="stretch_both")

.. _ug_basic_layouts_limits:

Limitations
-----------

The Bokeh layout system is not an all-purpose layout engine. It intentionally
sacrifices some capability to make common use cases and scenarios simple to
express. Complicated layouts with many different sizing modes may yield undesirable
results, both in terms of performance and visual appearance. For more involved
designs, use methods provided in :ref:`ug_output_embed` along with your own
custom HTML templates. This will let you take advantage of more sophisticated
CSS layout possibilities.

.. |column|    replace:: :func:`~bokeh.layouts.column`
.. |gridplot|  replace:: :func:`~bokeh.layouts.gridplot`
.. |layout|    replace:: :func:`~bokeh.layouts.layout`
.. |row|       replace:: :func:`~bokeh.layouts.row`
