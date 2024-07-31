.. _ug_styling_plots:

Styling plot elements
=====================

.. _ug_styling_plots_selecting:

Selecting plot objects
----------------------

If you want to customize the appearance of any element of your Bokeh plot, you
first need to identify which object you want to modify. As described in
:ref:`ug_intro`, Bokeh plots are a combination of Python objects that
represent all the different parts of your plot: its grids, axes, and glyphs, for
example.

Some objects have convenience methods to help you identify the objects you want
to address. See `Styling axes`_, `Styling grids`_, and `Styling legends`_ for
examples.

To query for any Bokeh plot object, use the |select| method on |Plot|. For
example, to find all `PanTool` objects in a plot:

.. code-block:: python

    >>> p.select(type=PanTool)
    [<bokeh.models.tools.PanTool at 0x106608b90>]

You can also use the |select| method to query on other attributes as well:

.. code-block:: python

    >>> p.circle(0, 0, radius=1, name="mycircle")
    <bokeh.plotting.figure at 0x106608810>

    >>> p.select(name="mycircle")
    [<bokeh.models.renderers.GlyphRenderer at 0x106a4c810>]

This query method can be especially useful when you want to style visual
attributes of `Styling glyphs`_.

.. _ug_styling_plots_plots:

Styling plots
-------------

In addition to the individual plot elements, a |Plot| object itself also has
several visual characteristics that you can customize: the dimensions of the
plot, its backgrounds, borders, or outlines, for example. This section describes
how to change these attributes of a Bokeh plot.

The example code primarily uses the |bokeh.plotting| interface to create plots.
However, the instructions apply regardless of how a Bokeh plot was created.

.. _ug_styling_plots_dimensions:

Dimensions
~~~~~~~~~~

To change the width and height of a |Plot|, use its ``width`` and
``height`` attributes. Those two attributes use |screen units|. They
control the size of the entire canvas area, including any axes or titles (but
not the toolbar).

If you are using the |bokeh.plotting| interface, you can pass these values to
|figure| directly:

.. bokeh-plot:: __REPO__/examples/styling/plots/dimensions.py
    :source-position: above

.. _ug_styling_plots_responsive_dimensions:

Responsive sizes
~~~~~~~~~~~~~~~~

To automatically adjust the width or height of your plot in relation to the
available space in the browser, use the plot's
:class:`~bokeh.models.plots.Plot.sizing_mode` property.

To control how the plot scales to fill its container, see the documentation for
:ref:`bokeh.models.layouts`, in particular the ``sizing_mode`` property of
:class:`~bokeh.models.layouts.LayoutDOM`.

If you set ``sizing_mode`` to anything different than ``fixed``, Bokeh adjusts
the ``width`` and ``height`` as soon as a plot is rendered. However,
Bokeh uses ``width`` and ``height`` to calculate the initial aspect
ratio of your plot.

Plots will only resize down to a minimum of 100px (height or width) to prevent
problems in displaying your plot.

.. _Bokeh GitHub repository: https://github.com/bokeh/bokeh

.. _ug_styling_plots_title:

Title
~~~~~

To style the title of your plot, use the |Title| annotation, which is available
as the ``.title`` property of the |Plot|.

You can use most of the standard |text properties|. However, ``text_align`` and
``text_baseline`` do not apply. To position the title relative to the entire
plot, use the properties :class:`~bokeh.models.annotations.Title.align` and
:class:`~bokeh.models.annotations.Title.offset` instead.

As an example, to set the color and font style of the title text, use
``plot.title.text_color``:

.. bokeh-plot:: __REPO__/examples/styling/plots/title.py
    :source-position: above

.. _ug_styling_plots_background:

Background
~~~~~~~~~~

To change the background fill style, adjust the ``background_fill_color`` and
``background_fill_alpha`` properties of the |Plot| object:

.. bokeh-plot:: __REPO__/examples/styling/plots/background_fill.py
    :source-position: above

.. _ug_styling_plots_border:

Border
~~~~~~

To adjust the border fill style, use the ``border_fill_color`` and
``border_fill_alpha`` properties of the |Plot| object. You can also set the
minimum border on each side (in |screen units|) with these properties:

* ``min_border_left``
* ``min_border_right``
* ``min_border_top``
* ``min_border_bottom``

Additionally, if you set ``min_border``, Bokeh applies a minimum border setting
to all sides as a convenience. The ``min_border`` default value is 40px.

.. bokeh-plot:: __REPO__/examples/styling/plots/min_border.py
    :source-position: above

.. _ug_styling_plots_outline:

Outline
~~~~~~~

Bokeh |Plot| objects have various |line properties|. To change the appearance of
outlines, use those line properties that are prefixed with ``outline_``.

For example, to set the color of the outline, use ``outline_line_color``:

.. bokeh-plot:: __REPO__/examples/styling/plots/plot_outline_line_color.py
    :source-position: above

.. _ug_styling_plots_glyphs:

Styling glyphs
--------------

To style the fill, line, or text properties of a glyph, you first need to
identify which ``GlyphRenderer`` you want to customize. If you are using the
|bokeh.plotting| interface, the glyph functions return the renderer:

.. code-block:: python

    >>> r = p.circle([1,2,3,4,5], [2,5,8,2,7], radius=1)
    >>> r
    <bokeh.models.renderers.GlyphRenderer at 0x106a4c810>

Next, obtain the glyph itself from the ``.glyph`` attribute of a
``GlyphRenderer``:

.. code-block:: python

    >>> r.glyph
    <bokeh.models.glyphs.Circle at 0x10799ba10>

This is the object to set fill, line, or text property values for:

.. bokeh-plot:: __REPO__/examples/styling/plots/glyph_properties.py
    :source-position: above

.. _ug_styling_plots_selected_unselected_glyphs:

Selected and unselected glyphs
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To customize the styling of selected and non-selected glyphs, set the
|selection_glyph| and |nonselection_glyph| attributes of the |GlyphRenderer|.
You can either set them manually or by passing them to |add_glyph|.

.. |add_glyph| replace:: :func:`~bokeh.models.plots.Plot.add_glyph`
.. |GlyphRenderer| replace:: :class:`~bokeh.models.renderers.GlyphRenderer`
.. |selection_glyph| replace:: :attr:`~bokeh.models.renderers.GlyphRenderer.selection_glyph`
.. |nonselection_glyph| replace:: :attr:`~bokeh.models.renderers.GlyphRenderer.nonselection_glyph`

The plot below uses the |bokeh.plotting| interface to set these attributes.
Click or tap any of the circles on the plot to see the effect on the selected
and non-selected glyphs. To clear the selection and restore the original state,
click anywhere in the plot *outside* of a circle.

.. bokeh-plot:: __REPO__/examples/styling/plots/glyph_selection_models.py
    :source-position: above

If you just need to set the color or alpha parameters of the selected or
non-selected glyphs, provide color and alpha arguments to the glyph function,
prefixed by ``"selection_"`` or ``"nonselection_"``:

.. bokeh-plot:: __REPO__/examples/styling/plots/glyph_selection.py
    :source-position: above

If you use the |bokeh.models| interface, use the
:func:`~bokeh.models.plots.Plot.add_glyph` function:

.. code-block:: python

    p = Plot()
    source = ColumnDataSource(dict(x=[1, 2, 3], y=[1, 2, 3]))

    initial_circle = Circle(x='x', y='y', fill_color='blue', radius=1)
    selected_circle = Circle(fill_alpha=1, fill_color="firebrick", line_color=None)
    nonselected_circle = Circle(fill_alpha=0.2, fill_color="blue", line_color="firebrick")

    p.add_glyph(source,
                initial_circle,
                selection_glyph=selected_circle,
                nonselection_glyph=nonselected_circle)

.. _ug_styling_plots_hover_inspections:

Hover inspections
~~~~~~~~~~~~~~~~~

To style the appearance of glyphs that are hovered over, pass color or alpha
parameters prefixed with ``"hover_"`` to your renderer function.

Alternatively, set the |selection_glyph| and |nonselection_glyph| attributes of
the |GlyphRenderer|, just like in
:ref:`ug_styling_plots_selected_unselected_glyphs` above.

This example uses the first method of passing a color parameter with the
``"hover_"`` prefix:

.. bokeh-plot:: __REPO__/examples/styling/plots/glyph_hover.py
    :source-position: above

Overriding non-visual properties
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Glyphs allow any data driven property to be overridden, not just visual
properties. This way the user can, for example, change the size of markers in
a scatter plot on hover or even offset a glyph from its original position. In
fact the user can override the primary glyph (``GlyphRenderer.glyph``) with a
completely unrelated one (e.g. replace ``Circle`` with a ``Rect``).

.. note::
    Only the primary glyph is used for hit testing and other functions. Secondary
    glyphs (``selection_glyph``, ``hover_glyph``, etc.) are used for painting and
    an only affect appearance of a glyph.

This examples shows how to override non-visual properties of a ``Circle`` glyph,
(``radius`` on hover) and how to use a different glyph on selection:

.. bokeh-plot:: __REPO__/examples/styling/plots/glyph_non_visual.py
    :source-position: above

.. _ug_styling_plots_axes:

Styling axes
------------

This section focuses on changing various visual properties of Bokeh plot axes.

To set style attributes on Axis objects, use the |xaxis|, |yaxis|, and
|axis| methods on |Plot| to first obtain a plot's Axis objects. For example:

.. code-block:: python

    >>> p.xaxis
    [<bokeh.models.axes.LinearAxis at 0x106fa2390>]

Because there may be more than one axis, this method returns a list of Axis
objects. However, as a convenience, these lists are *splattable*. This means that
you can set attributes directly on this result, and the attributes will be
applied to all the axes in the list. For example:

.. code-block:: python

    p.xaxis.axis_label = "Temperature"

This changes the value of ``axis_label`` for every x-axis of ``p``, however
many there may be.

The example below demonstrates the use of the |xaxis|, |yaxis|, and
|axis| methods in more details:

.. bokeh-plot:: __REPO__/examples/styling/plots/axis_properties.py
    :source-position: above

.. _ug_styling_plots_axes_labels:

Labels
~~~~~~

To add or change the text of an axis' overall label, use the ``axis_label``
property. To add line breaks to the text in an axis label, include ``\n`` in
your string.

To control the visual appearance of the label text, use any of the standard
|text properties| prefixed with ``axis_label_``. For instance, to set the text
color of the label, set ``axis_label_text_color``.

To change the distance between the axis label and the major tick labels, set the
``axis_label_standoff`` property.

For example:

.. bokeh-plot:: __REPO__/examples/styling/plots/labels.py
    :source-position: above

.. _ug_styling_plots_axes_bounds:

Bounds
~~~~~~

To limit the bounds where axes are drawn, set the ``bounds`` property of an axis
object to a 2-tuple of *(start, end)*:

.. bokeh-plot:: __REPO__/examples/styling/plots/bounds.py
    :source-position: above

.. _ug_styling_plots_axes_tick_lines:

Tick locations
~~~~~~~~~~~~~~

Bokeh uses several "ticker" models to decide where to display ticks on axes
(categorical, datetime, mercator, linear, or log scale). To configure the
placements of ticks, use the ``.ticker`` property of an axis.

If you use the |bokeh.plotting| interface, Bokeh chooses an appropriate ticker
placement model automatically.

In case you need to control which ticker placement model to use, you can also
explicitly define a list of tick locations. Assign
:class:`~bokeh.models.tickers.FixedTicker` with a list of tick locations to an
axis:

.. code-block:: python

    from bokeh.plotting import figure
    from bokeh.models.tickers import FixedTicker

    p = figure()

    # no additional tick locations will be displayed on the x-axis
    p.xaxis.ticker = FixedTicker(ticks=[10, 20, 37.4])

As a shortcut, you can also supply the list of ticks directly to an axis'
``ticker`` property:

.. bokeh-plot:: __REPO__/examples/styling/plots/fixed_ticker.py
    :source-position: above

``CustomJSTicker``
''''''''''''''''''

To fully customize the location of axis ticks, use the |CustomJSTicker| in
combination with a JavaScript snippet as its ``major_code`` and ``minor_code``
properties.

These code snippets should return lists of tick locations:

.. bokeh-plot:: __REPO__/examples/styling/plots/custom_js_ticker.py
    :source-position: above

Tick lines
~~~~~~~~~~

To control the visual appearance of the major and minor ticks, set the
appropriate |line properties|, prefixed with ``major_tick_`` and
``minor_tick_``, respectively.

For instance, to set the color of the major ticks, use
``major_tick_line_color``. To hide either set of ticks, set the color to
``None``.

Additionally, to control how far in and out of the plotting area the ticks
extend, use the properties ``major_tick_in``/``major_tick_out`` and
``minor_tick_in``/``minor_tick_out``. These values are in |screen units|.
Therefore, you can use negative values.

.. bokeh-plot:: __REPO__/examples/styling/plots/tick_lines.py
    :source-position: above

.. _ug_styling_plots_axes_tick_label_formats:

Tick label formats
~~~~~~~~~~~~~~~~~~

To style the text of axis labels, use the ``TickFormatter`` object of the axis'
``formatter`` property. Bokeh uses a number of ticker formatters by default in
different situations:

* |BasicTickFormatter| --- Default formatter for linear axes.

* |CategoricalTickFormatter| --- Default formatter for categorical axes.

* |DatetimeTickFormatter| --- Default formatter for datetime axes.

* |LogTickFormatter| --- Default formatter for log axes.

These default tick formatters do not expose many configurable properties.
To control tick formatting at a finer-grained level, use one of the
|NumeralTickFormatter| or |PrintfTickFormatter| described below.

.. note::
    To replace a tick formatter on an axis, you must set the ``formatter``
    property on an actual ``Axis`` object, not on a splattable list. This is
    why the following examples use ``p.yaxis[0].formatter``, etc. (with the
    subscript ``[0]``).

``NumeralTickFormatter``
''''''''''''''''''''''''

The |NumeralTickFormatter| has a ``format`` property that can be used
to control the text formatting of axis ticks.

.. bokeh-plot:: __REPO__/examples/styling/plots/numerical_tick_formatter.py
    :source-position: above

Many additional formats are available. See the full |NumeralTickFormatter|
documentation in the |reference guide|.

``PrintfTickFormatter``
'''''''''''''''''''''''

The |PrintfTickFormatter| has a ``format`` property that can be used
to control the text formatting of axis ticks using ``printf`` style
format strings.

.. bokeh-plot:: __REPO__/examples/styling/plots/printf_tick_formatter.py
    :source-position: above

For full details about formats, see the full |PrintfTickFormatter|
documentation in the |reference guide|.

``CustomJSTickFormatter``
'''''''''''''''''''''''''

To fully customize the format of axis ticks, use the |CustomJSTickFormatter| in
combination with a JavaScript snippet as its ``code`` property.

The variable ``tick`` contains the unformatted tick value. It is accessible in
the snippet or function namespace at render time:

.. bokeh-plot:: __REPO__/examples/styling/plots/custom_js_tick_formatter.py
    :source-position: above

.. _ug_styling_plots_axes_datetime_tick_context:

Datetime tick context
~~~~~~~~~~~~~~~~~~~~~

Datetime tick formatters have additional properties for adding more context to
ticks on datetime axes. For instance, a context format might show the year,
month, and day on the first tick, while the regular ticks show an hour and
minute.

This is especially useful in cases where an axis is zoomable. For example: when
zooming in to a level of seconds, the tick formatter context can provide
additional information about broader units of time, such as day or month.

The context options are:

``context``
    A format for adding context to the tick or ticks specified by
    ``context_which``. Values are:

    * None, no context is added
    * A standard  :class:`~bokeh.models.DatetimeTickFormatter` format string, this single
      format is used across all scales
    * Another :class:`~bokeh.models.DatetimeTickFormatter` instance, to add scale-dependent
      context

``context_which``
    Which tick or ticks to add a formatted context string to. Values are:
    ``"start"``, ``"end"``, ``"center"``, and ``"all"``.

``context_location``
    Relative to the tick label text baseline, where the context should be
    rendered. Values are: ``"below"``, ``"above"``, ``"left"``, and ``"right"``.

There is a pre-defined ``RELATIVE_DATETIME_CONTEXT`` that adds context that
is more or less a single scale higher. The example below demonstrates these
options:

.. bokeh-plot:: __REPO__/examples/styling/plots/datetime_tick_context.py
    :source-position: above

It is possible to "chain" multiple ``DatetimeTickFormatter`` instances together,
for as many levels of context as desired. For example:

.. code-block:: python

    p.xaxis.formatter.context = DatetimeTickFormatter(...)
    p.xaxis.formatter.context.context = DatetimeTickFormatter(...)

.. _ug_styling_plots_axes_tick_label_orientation:

Tick label orientation
~~~~~~~~~~~~~~~~~~~~~~

To control the orientation of major tick labels, use the
``major_label_orientation`` property. This property accepts the
values ``"horizontal"`` or ``"vertical"`` or a floating-point number
that gives the angle (in radians) to rotate from the horizontal:

.. bokeh-plot:: __REPO__/examples/styling/plots/tick_label_orientation.py
    :source-position: above

.. note::
    There are more properties that you can use to configure Bokeh axes. For a
    complete list of all the various attributes that you can set on different
    types of Bokeh axes, see the :ref:`bokeh.models.axes` section of the
    |reference guide|.

.. _ug_styling_plots_grids:

Styling grids
-------------

In this section, you will learn how to set the visual properties of grid
lines and grid bands on Bokeh plots.

To obtain a plot's Grid objects, use the |xgrid|, |ygrid|, and |grid| methods on
|Plot|. This works similar to the convenience methods for axes:

.. code-block:: python

    >>> p.grid
    [<bokeh.models.grids.Grid at 0x106fa2278>,
     <bokeh.models.grids.Grid at 0x106fa22e8>]

These methods also return splattable lists. You can set an attribute
on the list as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.grid.line_dash = [4 2]

.. note::
    The ``xgrid`` property provides the grid objects that *intersect* the
    x-axis (meaning vertically oriented objects). Correspondingly, ``ygrid``
    provides the grid objects that intersect the y-axis (meaning horizontally
    oriented objects).

.. _ug_styling_plots_grid_lines:

Lines
~~~~~

To configure the visual appearance of grid lines, use a collection of
|line properties|, prefixed with ``grid_``.

For instance, to set the color of grid lines, use ``grid_line_color``. To hide
grid lines, set their line color to ``None``:

.. bokeh-plot:: __REPO__/examples/styling/plots/grid_lines.py
    :source-position: above

Minor lines
~~~~~~~~~~~

To configure the visual appearance of minor grid lines, use a collection of
|line properties|, prefixed with ``minor_grid_``.

For instance, to set the color of grid lines, use ``minor_grid_line_color``. By
default, minor grid lines are hidden (which means that their line color is set
to ``None``):

.. bokeh-plot:: __REPO__/examples/styling/plots/minor_grid_lines.py
    :source-position: above

.. _ug_styling_plots_grid_bands:

Bands
~~~~~

Use "bands" to display filled, shaded bands between adjacent grid lines. To
control the visual appearance of these bands, use a collection of
|fill properties| and |hatch properties| that are prefixed with ``band_``.

For instance, to set the color of grid bands, use ``band_fill_color``. To hide
grid bands, set their fill color to ``None`` (this is the default).

This example defines bands filled with a solid color:

.. bokeh-plot:: __REPO__/examples/styling/plots/grid_band_fill.py
    :source-position: above

This example uses bands filled with a hatch pattern:

.. bokeh-plot:: __REPO__/examples/styling/plots/grid_band_hatch.py
    :source-position: above

.. _ug_styling_plots_grid_bounds:

Bounds
~~~~~~

To set explicit bounds that limit where grids are drawn, use a 2-tuple of
*(start, end)*. This is identical to setting
:ref:`bounds for axes <ug_styling_plots_axes_bounds>`:

.. bokeh-plot:: __REPO__/examples/styling/plots/grid_bounds.py
    :source-position: above


.. note::
    There are other properties that Bokeh grids support configuring. For a
    complete listing of all the various attributes that can be set on Bokeh
    plot grids, consult the :ref:`bokeh.models.grids` section of the
    |reference guide|.

.. _ug_styling_plots_legends:

Styling legends
---------------

Similar to the convenience methods for axes and grids, there is a
:func:`~bokeh.models.plots.Plot.legend` method on |Plot| that you can use to
obtain a plot's |Legend| objects:

bokeh.models.plots.Plot.legend

.. code-block:: python

    >>> p.legend
    [<bokeh.models.annotations.Legend at 0x106fa2278>]

This method also returns a splattable list. Therefore, you can set an attribute
on the list as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.legend.label_text_font = "times"

Location
~~~~~~~~

To control the location of the legend labels, use the ``location`` property.

Inside the plot area
''''''''''''''''''''

For legends in the central layout area, such as those created
automatically by |bokeh.plotting|, set ``location`` to one of the following
values:

``"top_left"``

``"top_center"``

``"top_right"`` (the default)

``"center_right"``

``"bottom_right"``

``"bottom_center"``

``"bottom_left"``

``"center_left"``

``"center"``

or a ``(x, y)`` tuple indicating an absolute location in screen coordinates
(pixels from the bottom-left corner).

.. bokeh-plot:: __REPO__/examples/styling/plots/legend_location.py
    :source-position: above

Outside the plot area
'''''''''''''''''''''

To position a legend outside the central area, use the ``add_layout`` method of
a plot. This requires creating the |Legend| object directly:

.. bokeh-plot:: __REPO__/examples/styling/plots/legend_location_outside.py
    :source-position: above

In this use-case, you need to specify the legend's location in absolute terms.
Future releases will add additional options to customize legend positions.

Title
~~~~~

To add or change a legend's title, use its ``title`` property:

.. code:: python

    plot.legend.title = "Division"

To control the visual appearance of the legend title, use any of the standard
|text properties| prefixed with ``title_``. For instance, to set the font
style of the legend, use ``title_text_font_style``.

To set the distance between the title and the rest of the legend (in pixels),
use the ``title_standoff`` property.

.. bokeh-plot:: __REPO__/examples/styling/plots/legend_title.py
    :source-position: above

Orientation
~~~~~~~~~~~

To control the orientation of the legend, use the ``orientation`` property.
Valid values for this property are:

* ``"vertical"``
* ``"horizontal"``

The default orientation is ``"vertical"``.

.. bokeh-plot:: __REPO__/examples/styling/plots/legend_orientation.py
    :source-position: above

Two dimensional layout
~~~~~~~~~~~~~~~~~~~~~~

It is possible to activate a two dimensional layout for the legend by setting a positive
integer to the properties ``nrows`` or ``ncols``. This enables the opportunity to avoid
truncated legends.

The default for ``nrows`` and ``ncols`` is ``"auto"``, which leads to one column if
the ``orientation`` property is ``"vertical"`` and one row if the ``orientation`` property
is ``"horizontal"``.

.. bokeh-plot:: __REPO__/examples/basic/annotations/legend_two_dimensions.py
    :source-position: above

Label text
~~~~~~~~~~

To control the visual appearance of the legend labels, use any of the standard
|text properties| prefixed with ``label_``. For instance, to set the font
style of the labels, use ``label_text_font_style``.

.. bokeh-plot:: __REPO__/examples/styling/plots/legend_label_text.py
    :source-position: above

Border
~~~~~~

To control the visual appearance of the legend border, use a collection of
|line properties|, prefixed with ``border_``. For instance, to set the color
of the border, use ``border_line_color``. To make the border invisible, set
the border line color to ``None``.

.. bokeh-plot:: __REPO__/examples/styling/plots/legend_border.py
    :source-position: above

Background
~~~~~~~~~~

To control the visual appearance of the legend background, use a collection
of |fill properties|, prefixed with ``background_``. For instance, to set the
color of the background, use ``background_fill_color``. To make the background
transparent, set the ``background_fill_alpha`` to ``0``.

.. bokeh-plot:: __REPO__/examples/styling/plots/legend_background.py
    :source-position: above

Dimensions
~~~~~~~~~~

To control dimensions such as the layout or spacing of label components, use
the following properties:

There are several properties that can be used to control the layout,
spacing, etc. of the legend components:

.. bokeh-prop:: Legend.label_standoff
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.label_width
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.label_height
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.glyph_width
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.glyph_height
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.padding
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.spacing
    :module: bokeh.models.annotations

.. bokeh-prop:: Legend.margin
    :module: bokeh.models.annotations


.. bokeh-plot:: __REPO__/examples/styling/plots/legend_dimensions.py
    :source-position: above

.. _ug_styling_plots_render_levels:

Setting render levels
---------------------

To specify the order in which things are drawn, use one of the following render
levels:

:image:
    "lowest" render level, drawn before anything else
:underlay:
    default render level for grids
:glyph:
    default render level for all glyphs (which means they are drawn above grids)
:annotation:
    default render level for annotation renderers
:overlay:
    "highest" render level, for tool overlays

Within a given level, renderers are drawn in the order that they were added.

To specify a render level explicitly, use the ``level`` parameter on the
renderer.

For example, to make sure an image is rendered *under* the grid lines, assign
the render level ``"image"`` to the ``level`` argument when calling your
``image`` renderer:

.. code-block:: python

    p.image(..., level="image")

You can see a complete example with output in the section
:ref:`ug_topics_images_colormapped`.


.. |select| replace:: :func:`~bokeh.models.plots.Plot.select`
.. |Title| replace:: :class:`~bokeh.models.annotations.Title`
.. |BasicTickFormatter| replace:: :class:`~bokeh.models.formatters.BasicTickFormatter`
.. |CategoricalTickFormatter| replace:: :class:`~bokeh.models.formatters.CategoricalTickFormatter`
.. |DatetimeTickFormatter| replace:: :class:`~bokeh.models.formatters.DatetimeTickFormatter`
.. |CustomJSTicker| replace:: :class:`~bokeh.models.tickers.CustomJSTicker`
.. |CustomJSTickFormatter| replace:: :class:`~bokeh.models.formatters.CustomJSTickFormatter`
.. |LogTickFormatter| replace:: :class:`~bokeh.models.formatters.LogTickFormatter`
.. |NumeralTickFormatter| replace:: :class:`~bokeh.models.formatters.NumeralTickFormatter`
.. |PrintfTickFormatter| replace:: :class:`~bokeh.models.formatters.PrintfTickFormatter`
.. |legend| replace:: :class:`~bokeh.plotting.figure.legend`
.. |grid|   replace:: :class:`~bokeh.plotting.figure.grid`
.. |xgrid|  replace:: :class:`~bokeh.plotting.figure.xgrid`
.. |ygrid|  replace:: :class:`~bokeh.plotting.figure.ygrid`
.. |axis|   replace:: :class:`~bokeh.plotting.figure.axis`
.. |xaxis|  replace:: :class:`~bokeh.plotting.figure.xaxis`
.. |yaxis|  replace:: :class:`~bokeh.plotting.figure.yaxis`
