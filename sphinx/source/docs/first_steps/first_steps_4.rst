.. _first_steps_4:

First steps 4: customizing your plot
====================================

In the :ref:`previous first steps guides <first_steps_3>`, you generated
different glyphs and added more information such as a title, legend, and
annotations.

In this section, you will customize the appearance of the plot as a whole. This
includes :ref:`resizing<first_steps_4_resizing>` your plot, changing its
:ref:`lines and colors<first_steps_4_grid>`, and customizing the
:ref:`axes<first_steps_4_axes>` and :ref:`tools<first_steps_4_toolbar>`.

.. _first_steps_4_resizing:

Resizing your plot
------------------

Bokeh's :class:`~bokeh.models.plots.Plot` objects have various attributes that
influence the way your plot looks.

Setting width and height
~~~~~~~~~~~~~~~~~~~~~~~~

To set the size of your plot, use the attributes
:class:`~bokeh.models.plots.Plot.plot_height` and
:class:`~bokeh.models.plots.Plot.plot_width` when calling the
:func:`~bokeh.plotting.figure` function:

.. literalinclude:: examples/first_steps_4_plot_size.py
   :language: python
   :emphasize-lines: 13,14

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_plot_size.py
    :source-position: none

Similar to :ref:`changing the design of an existing
glyph<first_steps_2_altering_existing>`, you can change a plot's attributes at
any time after its creation:

.. literalinclude:: examples/first_steps_4_resize_plot.py
   :language: python
   :emphasize-lines: 20,21

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_resize_plot.py
    :source-position: none

Enabling responsive plot sizing
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To make your plot automatically adjust to your browser size, use the attribute
:class:`~bokeh.models.plots.Plot.sizing_mode`:

.. literalinclude:: examples/first_steps_4_plot_size_responsive.py
   :language: python
   :emphasize-lines: 13,14

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_plot_size_responsive.py
    :source-position: none

.. seealso::
    To learn more about how to control the size of plots, see
    :ref:`userguide_styling_plots` in the user guide and the entry for
    :class:`~bokeh.models.plots.Plot` in the reference guide. For more
    information on responsive sizing, see
    :class:`~bokeh.models.plots.Plot.sizing_mode` in the reference guide.

.. _first_steps_4_axes:

Customizing axes
----------------

You can set various attributes to change the way the axes in your plot work and
look.

Setting your axes' appearance
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Options for customizing the appearance of your plot includes:

* setting labels for your axes
* styling options for the numbers displayed with your axes
* defining colors and other layout properties for the axes themselves

For example:


.. literalinclude:: examples/first_steps_4_axes_customizing.py
   :language: python
   :emphasize-lines: 17-19,22-24,27,28

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_axes_customizing.py
    :source-position: none

Enabling logarithmic axes
~~~~~~~~~~~~~~~~~~~~~~~~~

You can also change the axis type all together. Use ``y_axis_type="log"`` to
switch to logarithmic axes:

.. literalinclude:: examples/first_steps_4_axes_logarithmic.py
   :language: python
   :emphasize-lines: 17,18

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_axes_logarithmic.py
    :source-position: none

Enabling datetime axes
~~~~~~~~~~~~~~~~~~~~~~

Set the ``x_axis_type`` or ``y_axis_type`` to ``datetime`` to display date or
time information on an axis. Bokeh then creates a
:class:`~bokeh.models.axes.DatetimeAxis`:

.. literalinclude:: examples/first_steps_4_datetime_axis.py
   :language: python
   :emphasize-lines: 18

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_datetime_axis.py
    :source-position: none

.. include:: sample_data_note.txt

This example also uses NumPy to process data. Bokeh is able to read the data
directly from the NumPy arrays.

.. seealso::
    See :ref:`userguide_styling_axes` in the user guide for more information on
    customizing axes. The entry for :class:`~bokeh.models.axes.Axis` in the
    reference guide contains a list of all available attributes you can use to
    customize the axes of your plot.

.. _first_steps_4_grid:

Customizing the grid
--------------------

To change the appearance of the grid, set the various properties of the
:func:`~bokeh.models.plots.Plot.xgrid`,
:func:`~bokeh.models.plots.Plot.ygrid`, and
:func:`~bokeh.models.plots.Plot.grid` methods of your
:class:`~bokeh.models.plots.Plot` object.

Styling lines
~~~~~~~~~~~~~

Change what the horizontal and vertical lines of your grid look like by setting
the various ``grid_line`` properties:

.. literalinclude:: examples/first_steps_4_grid_lines.py
   :language: python
   :emphasize-lines: 17,20,21

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_grid_lines.py
    :source-position: none

.. seealso::
    For more information on lines and minor lines, see
    :ref:`userguide_styling_grid_lines` in the user guide.

Using bands and bounds
~~~~~~~~~~~~~~~~~~~~~~

Another way to make reading your plot easier is to use bands and bonds.

Bands and bonds are more examples of the annotations you learned about in
:ref:`first_steps_3_annotations`.

.. literalinclude:: examples/first_steps_4_bands.py
   :language: python
   :emphasize-lines: 17,18,21

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_bands.py
    :source-position: none

.. seealso::
    For more information on styling bands and bonds, see
    :ref:`userguide_styling_grid_bands` and :ref:`userguide_styling_grid_bounds`
    in the user guide.

Setting background colors
~~~~~~~~~~~~~~~~~~~~~~~~~

You have several options to define colors in Bokeh:

* Use one of the 147 named SVG colors (for example, ``"firebrick"``)
* Use hexadecimal values, prefaced with a ``#`` (for example ``"#00ff00"``)
* Use a 3-tuple for RGB colors (for example, ``(100, 100, 255)``
* Use a 4-tuple for RGBa colors (for example ``(100, 100, 255, 0.5)``)

To change the appearance of the plane that Bokeh draws your plot elements on,
use the various ``fill_color`` attributes of your
:class:`~bokeh.models.plots.Plot` object:

.. literalinclude:: examples/first_steps_4_background.py
   :language: python
   :emphasize-lines: 17-19

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_background.py
    :source-position: none

.. seealso::
    For more information on colors in Bokeh, see the entry for
    :class:`~bokeh.core.properties.Color` in the reference guide.

.. _first_steps_4_toolbar:

Customizing the toolbar
-----------------------

Bokeh comes with a powerful toolbar to explore plots. You saw those tools in
your very fist visualization, as part of
:ref:`first step guide 1 <first_steps_1_line_chart>`.

Positioning the toolbar
~~~~~~~~~~~~~~~~~~~~~~~
To define the position of the toolbar, use the
:class:`~bokeh.models.plots.Plot.toolbar_location` attribute with one of these
values: ``above``, ``below``, ``left``, ``right``

Pass a value to ``toolbar_location`` when creating your figure:

.. code-block:: python

    p = figure(title="Toolbar positioning example", toolbar_location="below")

Another option is to change the attribute ``toolbar_location`` at any time after
creating your figure:

.. code-block:: python

    p.toolbar_location = "below"

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_toolbar.py
    :source-position: none

Deactivating and hiding the toolbar
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To deactivate the toolbar completely, set ``toolbar_location`` to ``None``.

.. code-block:: python

    p.toolbar_location = None

To make your toolbar hide automatically, set
:class:`~bokeh.models.tools.Toolbar.autohide` to ``True``:

.. literalinclude:: examples/first_steps_4_toolbar_autohide.py
   :language: python
   :lines: 14

With ``autohide`` set to ``True``, Bokeh will hide the toolbar unless the mouse
is inside the plot area:

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_toolbar_autohide.py
    :source-position: none

Similarly, use the :class:`~bokeh.models.tools.Toolbar.logo` property of the
:class:`~bokeh.models.tools.Toolbar` to deactivate the Bokeh logo:

.. code-block:: python

    p.toolbar.logo = None

Customizing available tools
~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can customize which tools Bokeh displays in the toolbar. For a detailed
list of all available tools, see :ref:`userguide_tools` in the
user guide.

To customize which tools to use, you first need to import the tools you want to
use. For example:

.. code-block:: python

    from bokeh.models.tools import BoxZoomTool, ResetTool

Define which tools to use when creating a new figure by passing the ``tools``
attribute to the :func:`~bokeh.plotting.figure` function.

The ``tools`` attribute accepts a list of tools. This example enables only the
:class:`~bokeh.models.tools.BoxZoomTool` and
:class:`~bokeh.models.tools.ResetTool`:

.. code-block:: python

    p = figure(tools = [BoxZoomTool(), ResetTool()])

This way, only the box zoom tool and the reset tool will be available in the
toolbar:

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_tools.py
    :source-position: none

To change the available tools at any time after creating your figure, you need
to use the :func:`~bokeh.models.plots.Plot.add_tools` function.

All tools also offer various properties to define how they can be used. With the
:class:`~bokeh.models.tools.PanTool`, for example, you can limit the movement to
only horizontal or vertical panning. The default behavior is to allow panning in
both directions.

.. literalinclude:: examples/first_steps_4_add_tools.py
   :language: python
   :emphasize-lines: 1,14,22

In this example, you are including the box zoom tool and the reset tool when
creating your function. You then add pan zoom tool, resulting in all three tools
being available:

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_add_tools.py
    :source-position: none

.. seealso::
    To learn more about tools and toolbars, see :ref:`userguide_tools`. For
    detailed information about all tools and their respective properties, see
    :class:`~bokeh.models.tools` and :class:`~bokeh.models.tools.Toolbar` in the
    reference guide.

.. panels::
    :column: col-lg-6 col-md-6 col-sm-6 col-xs-12 p-2

    .. link-button:: first_steps_3.html
        :text: Previous
        :classes: stretched-link

    ---
    :card: + text-right
    .. link-button:: first_steps_5.html
        :text: Next
        :classes: stretched-link
