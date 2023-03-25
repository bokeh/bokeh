.. _first_steps_4:

First steps 4: Customizing your plot
====================================

In the :ref:`previous first steps guides <first_steps_3>`, you generated
different glyphs and added more information such as a title, legend, and
annotations.

In this section, you will customize the appearance of the plot as a whole. This
includes :ref:`resizing<first_steps_4_resizing>` your plot, changing its
:ref:`lines and colors<first_steps_4_grid>`, and customizing the
:ref:`axes<first_steps_4_axes>` and :ref:`tools<first_steps_4_toolbar>`.

.. _first_steps_4_themes:

Using Themes
------------

With Bokeh's themes, you can quickly change the appearance of your plot. Themes
are a set of pre-defined design parameters such as colors, fonts, or line
styles.

Bokeh comes with five :ref:`built-in themes <bokeh.themes>`: ``caliber``,
``dark_minimal``, ``light_minimal``, ``night_sky``, and ``contrast``.
Additionally, you can define your own custom themes.

To use one of the built-in themes, assign the name of the theme you want to use
to the ``theme`` property of your document:

.. literalinclude:: examples/first_steps_4_themes.py
   :language: python
   :emphasize-lines: 9

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_themes.py
    :source-position: none

You can also create your own themes to use across multiple plots. Bokeh's themes
can be either in a YAML or JSON format. To learn more about creating and using
customized themes, see :ref:`ug_styling_using_themes_custom` in the user
guide.

.. seealso::
    For more information on using themes with Bokeh, see
    :ref:`ug_styling_using_themes` in the user guide and
    :class:`bokeh.themes` in the reference guide.

.. _first_steps_4_resizing:

Resizing your plot
------------------

Bokeh's |Plot| objects have various attributes that influence the way your plot
looks.

Setting width and height
~~~~~~~~~~~~~~~~~~~~~~~~

To set the size of your plot, use the attributes ``width`` and ``height`` when
calling the |figure| function:

.. literalinclude:: examples/first_steps_4_plot_size.py
   :language: python
   :emphasize-lines: 10-11

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_plot_size.py
    :source-position: none

Similar to :ref:`changing the design of an existing
glyph<first_steps_2_altering_existing>`, you can change a plot's attributes at
any time after its creation:

.. literalinclude:: examples/first_steps_4_resize_plot.py
   :language: python
   :emphasize-lines: 17,18

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_resize_plot.py
    :source-position: none

Enabling responsive plot sizing
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To make your plot automatically adjust to your browser or screen size, use the
attribute :class:`~bokeh.models.plots.Plot.sizing_mode`:

.. literalinclude:: examples/first_steps_4_plot_size_responsive.py
   :language: python
   :emphasize-lines: 10,11

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_plot_size_responsive.py
    :source-position: none

.. seealso::
    To learn more about how to control the size of plots, see
    :ref:`ug_styling_plots_plots` in the user guide and the entry for
    |Plot| in the reference guide.

    For more information on responsive sizing, see
    :ref:`ug_basic_layouts_sizing_mode` in the user guide and
    :class:`~bokeh.models.plots.Plot.sizing_mode` in the reference guide.

.. _first_steps_4_axes:

Customizing axes
----------------

You can set various attributes to change the way the axes in your plot work and
look.

Setting your axes' appearance
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Options for customizing the appearance of your plot include:

* setting labels for your axes
* styling the numbers displayed with your axes
* defining colors and other layout properties for the axes themselves

For example:

.. literalinclude:: examples/first_steps_4_axes_customizing.py
   :language: python
   :emphasize-lines: 19-21,24-26,29-30

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_axes_customizing.py
    :source-position: none

Defining axis ranges
~~~~~~~~~~~~~~~~~~~~

When drawing the axes for your plot, Bokeh automatically determines the range
each axis needs to cover in order to display all your values. For example, if
the values on your y-axis are between 2 and 17, Bokeh automatically creates
a y-axis that ranges from a little below 2 to a little above 17.

To define the range for your axes manually, use the
:func:`~bokeh.models.plots.Plot.y_range` function or the
:func:`~bokeh.models.plots.Plot.y_range` properties of your |Plot| object when
you call the |figure| function:

.. literalinclude:: examples/first_steps_4_plot_axis_ranges.py
   :language: python
   :emphasize-lines: 9

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_plot_axis_ranges.py
    :source-position: none

Formatting axis ticks
~~~~~~~~~~~~~~~~~~~~~

You can format the text that appears alongside your axes with Bokeh's
``TickFormatter`` objects. Use these formatters to display currency
symbols on your y-axis, for example:

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_tick_formatter.py
    :source-position: none

To display dollar amounts instead of just numbers on your y-axis, use the
:class:`~bokeh.models.formatters.NumeralTickFormatter`:

First, import the :class:`~bokeh.models.formatters.NumeralTickFormatter` from
|bokeh.models|:

.. code-block:: python

    from bokeh.models import NumeralTickFormatter

Then, after creating your plot with the ``figure()`` function, assign the
``NumeralTickFormatter`` to the ``formatter`` property of your plot's ``yaxis``:

.. code-block:: python

    p.yaxis[0].formatter = NumeralTickFormatter(format="$0.00")

The :class:`~bokeh.models.formatters.NumeralTickFormatter` supports different
formats, including ``"$0.00"`` to generate values such as ``"$7.42"``.

This is what the completed code looks like:

.. literalinclude:: examples/first_steps_4_tick_formatter.py
   :language: python
   :emphasize-lines: 1,17

.. seealso::
    For more information about formatting ticks, see
    :ref:`ug_styling_plots_axes_tick_label_formats` in the user guide. For a
    list of all available tick formatters, see :class:`~bokeh.models.formatters`
    in the reference guide.

Enabling logarithmic axes
~~~~~~~~~~~~~~~~~~~~~~~~~

You can also change the axis type altogether. Use ``y_axis_type="log"`` to
switch to logarithmic axes:

.. literalinclude:: examples/first_steps_4_axes_logarithmic.py
   :language: python
   :emphasize-lines: 15,16

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_axes_logarithmic.py
    :source-position: none

Enabling datetime axes
~~~~~~~~~~~~~~~~~~~~~~

Set the ``x_axis_type`` or ``y_axis_type`` to ``datetime`` to display date or
time information on an axis. Bokeh then creates a
:class:`~bokeh.models.axes.DatetimeAxis`.

To format the ticks of a ``DatetimeAxis``, use the
:class:`~bokeh.models.formatters.DatetimeTickFormatter`.

.. literalinclude:: examples/first_steps_4_datetime_axis.py
   :language: python
   :emphasize-lines: 15,28

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_datetime_axis.py
    :source-position: none

.. seealso::
    See :ref:`ug_styling_plots_axes` in the user guide for more information on
    customizing axes. The entry for :class:`~bokeh.models.Axis` in the
    reference guide contains a list of all available attributes you can use to
    customize the axes of your plot.

.. _first_steps_4_grid:

Customizing the grid
--------------------

To change the appearance of the grid, set the various properties of the
:func:`~bokeh.models.plots.Plot.xgrid`,
:func:`~bokeh.models.plots.Plot.ygrid`, and
:func:`~bokeh.models.plots.Plot.grid` methods of your |Plot| object.

Styling lines
~~~~~~~~~~~~~

Change what the horizontal and vertical lines of your grid look like by setting
the various ``grid_line`` properties:

.. literalinclude:: examples/first_steps_4_grid_lines.py
   :language: python
   :emphasize-lines: 19,22,23

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_grid_lines.py
    :source-position: none

.. seealso::
    For more information on lines and minor lines, see
    :ref:`ug_styling_plots_grid_lines` in the user guide.

Using bands and bounds
~~~~~~~~~~~~~~~~~~~~~~

Another way to make reading your plot easier is to use bands and bounds.

Bands and bounds are more examples of the annotations you learned about in
:ref:`first_steps_3_annotations`.

.. literalinclude:: examples/first_steps_4_bands.py
   :language: python
   :emphasize-lines: 19,20,23

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_bands.py
    :source-position: none

.. seealso::
    For more information on styling bands and bounds, see
    :ref:`ug_styling_plots_grid_bands` and :ref:`ug_styling_plots_grid_bounds`
    in the user guide.

Setting background colors
~~~~~~~~~~~~~~~~~~~~~~~~~

You have several options to :ref:`define colors <ug_styling_colors>` in
Bokeh. For example:

* Use one of the |named CSS colors| (for example, ``"firebrick"``)
* Use hexadecimal values, prefaced with a ``#`` (for example ``"#00ff00"``)
* Use a 3-tuple for RGB colors (for example, ``(100, 100, 255)``
* Use a 4-tuple for RGBA colors (for example ``(100, 100, 255, 0.5)``)

To change the appearance of the plane that Bokeh draws your plot elements on,
use the various ``fill_color`` attributes of your |Plot| object:

.. literalinclude:: examples/first_steps_4_background.py
   :language: python
   :emphasize-lines: 19-21

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_background.py
    :source-position: none

.. seealso::
    For more information on colors in Bokeh, see the entry for |Color| in the
    reference guide.

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
   :emphasize-lines: 16

With ``autohide`` set to ``True``, Bokeh will hide the toolbar unless the mouse
is inside the plot area or you tap inside the plot area:

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_toolbar_autohide.py
    :source-position: none

Similarly, use the :class:`~bokeh.models.tools.Toolbar.logo` property of the
:class:`~bokeh.models.tools.Toolbar` to deactivate the Bokeh logo:

.. code-block:: python

    p.toolbar.logo = None

Customizing available tools
~~~~~~~~~~~~~~~~~~~~~~~~~~~

You can customize which tools Bokeh displays in the toolbar. For a detailed
list of all available tools, see :ref:`ug_interaction_tools` in the
user guide.

To customize which tools to use, you first need to import the relevant tools.
For example:

.. code-block:: python

    from bokeh.models.tools import BoxZoomTool, ResetTool

Next, define which tools to use when creating a new figure by passing the
``tools`` attribute to the |figure| function.

The ``tools`` attribute accepts a list of tools. This example enables only the
:class:`~bokeh.models.tools.BoxZoomTool` and
:class:`~bokeh.models.tools.ResetTool`:

.. code-block:: python

    p = figure(tools = [BoxZoomTool(), ResetTool()])

This way, only the box zoom tool and the reset tool will be available in the
toolbar:

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_tools.py
    :source-position: none

To change the available tools at any time after creating your figure,
use the :func:`~bokeh.models.plots.Plot.add_tools` and :func:`~bokeh.models.plots.Plot.remove_tools` functions.

All tools also offer various properties to define how they can be used. With the
:class:`~bokeh.models.tools.PanTool`, for example, you can limit the movement to
only horizontal or vertical panning. The default behavior is to allow panning in
both directions.

.. literalinclude:: examples/first_steps_4_add_tools.py
   :language: python
   :emphasize-lines: 1,11,19

In this example, you first include the box zoom tool and the reset tool when
creating your function. Next, you add a pan zoom tool. This results in all three
tools being available:

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_add_tools.py
    :source-position: none

.. seealso::
    To learn more about tools and toolbars, see :ref:`ug_interaction_tools`. For
    detailed information about all tools and their respective properties, see
    :class:`~bokeh.models.tools` and :class:`~bokeh.models.tools.Toolbar` in the
    reference guide.

.. _first_steps_4_tooltips:

Adding tooltips
---------------

Tooltips are little windows that appear when you hover your mouse over a
data point or when you tap on a data point:

.. bokeh-plot:: docs/first_steps/examples/first_steps_4_tooltips.py
    :source-position: none

Tooltips are based on the :class:`~bokeh.models.tools.HoverTool`. The hover tool
is part of Bokeh's toolbar.

There are several ways to enable tooltips in Bokeh. This is the quickest:

1. Import the :class:`~bokeh.models.tools.HoverTool` class from
   :class:`bokeh.models.tools`.

2. Include ``HoverTool()`` in the list passed to the ``tools`` argument when
   calling the |figure| function.

3. Include the :class:`~bokeh.models.tools.HoverTool.tooltips` argument when
   calling the |figure| function.

The ``tooltips`` argument accepts a string with a special syntax. Use the "@"
symbol to include the name of the source for the data you want Bokeh to display.
This example includes ``@x`` and ``@y``. When the browser displays a tooltip,
Bokeh replaces both those fields with the actual data from the lists ``x`` and
``y`` .

This is what the code looks like:

.. literalinclude:: examples/first_steps_4_tooltips.py
   :language: python
   :emphasize-lines: 1,11,12

.. seealso::
    The user guide contains much more information on using the hover tool to
    create tooltips. See :ref:`ug_interaction_tools_basic_tooltips` for more details.
    More information is also available at the entry for
    :class:`~bokeh.models.tools.HoverTool` in the reference guide.
