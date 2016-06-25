.. _userguide_styling:

Styling Visual Attributes
=========================

.. _userguide_styling_using_palettes:

Using Palettes
--------------

Palettes are sequences (lists or tuples) of RGB(A) hex strings that define a
colormap and be can set as the ``palette`` attribute of all chart types from
``bokeh.charts`` and as the ``color`` attribute of many plot objects from
``bokeh.plotting``. Bokeh offers many of the standard Brewer palettes, which
can be imported from the ``bokeh.palettes`` module. For example, importing
“Spectral6” gives a six element list of RGB(A) hex strings from the Brewer
“Spectral” colormap.

.. code-block:: python

    >>> from bokeh.palettes import Spectral6
    >>> Spectral6
    ['#3288bd', '#99d594', '#e6f598', '#fee08b', '#fc8d59', '#d53e4f']

All of the standard palettes included in bokeh can be found at
:ref:`bokeh.palettes`. Custom palettes can be made by creating sequences of
RGB(A) hex strings.

.. _userguide_styling_visual_properties:

Visual Properties
-----------------

In order to style the visual attributes of Bokeh plots, you first must
know what the available properties are. The full :ref:`refguide` will
list all the properties of every object individually, though there are three
broad groups of properties that show up often. They are:

* **line properties** line color, width, etc.
* **fill properties** fill color, alpha, etc.
* **text properties** font styles, colors, etc.

Below is more detail about each of these.

.. _userguide_styling_line_properties:

Line Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/line_props.txt

.. _userguide_styling_fill_properties:

Fill Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/fill_props.txt

.. _userguide_styling_text_properties:

Text Properties
~~~~~~~~~~~~~~~

.. include:: ../includes/text_props.txt

.. _userguide_styling_colors:

Specifying Colors
~~~~~~~~~~~~~~~~~

Colors properties are used in many places in Bokeh, to specify the colors to
use for lines, fills or text. Color values can be provided in any of the
following ways:

.. include:: ../includes/colors.txt

.. warning::
    Supplying lists of RGB or RGBA color tuples as color arguments (either
    directly or as a DataSource column reference) doesn't work. You may read a
    discussion of the issue on our project `GitHub`_ page. Suggested
    work-arounds include using lists of:

    * RGB hexadecimal values
    * `bokeh.colors.RGB` objects (i.e. ``[RGB(255, 0, 0), RGB(0, 255, 0)"]``)
    * CSS-format RGB/RGBA strings (i.e. ``["rgb(255, 0, 0)", "rgb(0, 255, 0)"]``)

.. _GitHub: https://github.com/bokeh/bokeh/issues/2622

Color alpha can be specified in multiple ways for the visual properties. This
can be by specifying the alpha directly with ``line|fill_alpha``, or by
providing the alpha through the RGBA 4-tuple for the ``line|fill_color``.

Additionally, there is also the freedom to use a combination of the two, or no
alpha at all. The following figure demonstrates each possible combination of
the inputs for line and fill alphas:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_specifying_colors.py
    :source-position: none

.. note::
    If using the |bokeh.plotting| interface, another option is to specify
    ``color`` and/or ``alpha`` as a keyword, as well as the demonstrated color
    properties. These inputs work by applying the provided value to both of the
    corresponding ``line`` and ``fill`` properties. However, you can still
    provide ``fill|line_alpha`` or ``fill|line_color`` in combination with
    the ``color``/``alpha`` keywords, and the former will take precedence.

.. _userguide_styling_arrow_annotations:

Styling Arrow Annotations
~~~~~~~~~~~~~~~~~~~~~~~~~

There are several `ArrowHead` subtypes that can be applied to Arrow
annotations. Setting the `start` or `end` property to None will
cause no arrow head to be applied at the specified arrow end. Double-sided
arrows can be created by setting both `start` and `end` styles.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_arrow_annotations.py
    :source-position: none

.. _userguide_styling_units:

Screen Units and Data-space Units
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Screen units use raw numbers of pixels to specify height or width, while
data-space units are relative to the data and the axes of the chart. For
example, in a 400 pixel by 400 pixel graph with x and y axes ranging from 0
through 10, a glyph one fifth as wide and tall as the graph would be 80 screen
units or 2 data-space units.

.. _userguide_styling_selecting:

Selecting Plot Objects
----------------------

As described in :ref:`userguide_concepts`, Bokeh plots comprise graphs of
objects that represent all the different parts of the plot: grids, axes,
glyphs, etc. In order to style Bokeh plots, it is necessary to first find
the right object, then set its various attributes. Some objects have
convenience methods to help find the objects of interest (see `Axes`_,
`Grids`_, and `Legends`_). But there is also a |select| method on |Plot|
that can be used to query for Bokeh plot objects more generally.

For example, you can query for objects by type. The following snippet
returns all the `PanTool` objects a plot has:

.. code-block:: python

    >>> p.select(type=PanTool)
    [<bokeh.models.tools.PanTool at 0x106608b90>]

The |select| method can query on other attributes as well:

.. code-block:: python

    >>> p.circle(0, 0, name="mycircle")
    <bokeh.plotting.Figure at 0x106608810>

    >>> p.select(name="mycircle")
    [<bokeh.models.renderers.GlyphRenderer at 0x106a4c810>]

This sort of query can be especially useful for styling visual attributes
of `Glyphs`_.

.. _userguide_styling_plots:

Plots
-----

|Plot| objects themselves have many visual characteristics that can be styled:
the dimensions of the plot, backgrounds, borders, outlines, etc. This section
describes how to change these attributes of a Bokeh plot. The example code
primarily uses the |bokeh.plotting| interface to create plots, however the
instructions apply regardless of how a Bokeh plot was created.

.. _userguide_styling_plot_dimensions:

Dimensions
~~~~~~~~~~

The dimensions (width and height) of a |Plot| are controlled by ``plot_width``
and ``plot_height`` attributes. These values are in screen units, and they
control the size of the entire canvas area, including any axes or titles (but
not the toolbar). If you are using the |bokeh.plotting| or |bokeh.charts|
interfaces, then these values can be passed to |figure| or the Chart function
as a convenience:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_dimensions.py
    :source-position: above


.. _userguide_styling_plot_responsive_dimensions:

Responsive Dimensions
~~~~~~~~~~~~~~~~~~~~~

In addition, you can use the ``responsive`` attribute. The responsive attribute
causes the plot to fill the container it's sitting in, and to respond to
changes in browser size. Responsive web elements are common-place in web
development and the ``responsive`` flag may be useful if you are trying to
present your plot on a website where you want it to conform to a number of
browsers. If you set the responsive flag, the ``plot_width`` and ``plot_height`` will
immediately change when a plot is rendered to fill the container. However,
those parameters will be used to calculate the initial aspect ratio for your
plot, so you may want to keep them. Plots will only resize down to a minimum of
100px (height or width) to prevent problems in displaying your plot.

.. warning::
    This feature is known not to work when combined with HBox.
    This is a new feature and may have other issues when used in different circumstances.
    Please report these issues on the  `Bokeh GitHub repository`_ or the `Bokeh mailing list`_.

.. _Bokeh GitHub repository: https://github.com/bokeh/bokeh
.. _Bokeh mailing list: https://groups.google.com/a/continuum.io/forum/#!forum/bokeh

.. _userguide_styling_plot_title:

Title
~~~~~

The styling of the plot title is controlled by a set of `Text Properties`_
on a |Title| annotation available as the ``.title`` property of the |Plot|.
For instance, to set the color of the title text, use ``plot.title.text_color``:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_title.py
    :source-position: above

.. _userguide_styling_plot_background:

Background
~~~~~~~~~~

The background fill style is controlled by the ``background_fill_color`` and
``background_fill_alpha`` properties of the |Plot| object:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_background_fill.py
    :source-position: above

.. _userguide_styling_plot_border:

Border
~~~~~~

The border fill style is controlled by the ``border_fill_color`` and
``border_fill_alpha`` properties of the |Plot| object. You can also set the
minimum border on each side (in screen units) with the properties

``min_border_left``

``min_border_right``

``min_border_top``

``min_border_bottom``

Additionally, setting ``min_border`` will apply a minimum border setting
to all sides as a convenience. The ``min_border`` default value is 40px.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_min_border.py
    :source-position: above

.. _userguide_styling_plot_outline:

Outline
~~~~~~~

The styling of the outline of the plotting area is controlled by a set of
`Line Properties`_ on the |Plot|, that are prefixed with ``outline_``. For
instance, to set the color of the outline, use ``outline_line_color``:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_plot_outline_line_color.py
    :source-position: above

.. _userguide_styling_glyphs:

Glyphs
------

To style the fill, line, or text properties of a glyph, it is first
necessary to obtain a specific ``GlyphRenderer``. When using the
|bokeh.plotting| interface, the glyph functions return the renderer:

.. code-block:: python

    >>> r = p.circle([1,2,3,4,5], [2,5,8,2,7])
    >>> r
    <bokeh.models.renderers.GlyphRenderer at 0x106a4c810>

Then, the glyph itself is obtained from the ``.glyph`` attribute of a
``GlyphRenderer``:

.. code-block:: python

    >>> r.glyph
    <bokeh.models.markers.Circle at 0x10799ba10>

This is the object to set fill, line, or text property values for:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_glyph_properties.py
    :source-position: above

.. _userguide_styling_selected_unselected_glyphs:

Selected and Unselected Glyphs
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The styling of selected and non-selected glyphs can be customized by
setting the |selection_glyph| and/or |nonselection_glyph| attributes
of the |GlyphRenderer| either manually or by passing them to |add_glyph|.

.. |add_glyph| replace:: :func:`~bokeh.models.plots.Plot.add_glyph`
.. |GlyphRenderer| replace:: :class:`~bokeh.models.renderers.GlyphRenderer`
.. |selection_glyph| replace:: :attr:`~bokeh.models.renderers.GlyphRenderer.selection_glyph`
.. |nonselection_glyph| replace:: :attr:`~bokeh.models.renderers.GlyphRenderer.nonselection_glyph`

The plot below demonstrates how to set these attributes using the
|bokeh.plotting| interface. Click or tap circles on the plot to see the
effect on the selected and nonselected glyphs. To clear the selection
and restore the original state, click anywhere in the plot *outside* of a
circle.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_glyph_selections_plotting_glyph.py
    :source-position: above

If you just need to set the color or alpha parameters of the selected or
nonselected glyphs, this can be accomplished even more simply by providing
color and alpha arguments to the glyph function, prefixed by ``"selection_"``
or ``"nonselection_"``. The plot below demonstrates this technique:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_glyph_selections_plotting_params.py
    :source-position: above

The same could also be achieved with the models interface as follows:

.. code-block:: python

    p = Plot()
    source = ColumnDataSource(dict(x=[1, 2, 3], y=[1, 2, 3]))

    initial_circle = Circle(x='x', y='y', fill_color='blue', size=50)
    selected_circle = Circle(fill_alpha=1, fill_color="firebrick", line_color=None)
    nonselected_circle = Circle(fill_alpha=0.2, fill_color="blue", line_color="firebrick")

    p.add_glyph(source,
                initial_circle,
                selection_glyph=selected_circle,
                nonselection_glyph=nonselected_circle)

.. note::
    Only the *visual* properties of ``selection_glyph`` and
    ``nonselection_glyph`` are considered when rendering. Changing
    positions, sizes, etc. will have no effect.

Hover Inspections
~~~~~~~~~~~~~~~~~

Setting the highlight policy for glyphs that are hovered over is completely
analogous to setting the ``selection_glyph`` or ``nonselection_glyph``, or
by passing color or alpha parameters prefixed with ``"hover_"``. The example
below demonstrates the latter method:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_glyph_hover.py
    :source-position: above

.. note::
    Only the *visual* properties of ``hover_glyph`` are considered when
    rendering. Changing positions, sizes, etc. will have no effect.

.. _userguide_styling_tool_overlays:

Tool Overlays
-------------

Some Bokeh tools also have configurable visual attributes. For instance the
various region selection tools and box zoom tool all have an ``overlay``
whose line and fill properties may be set:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_tool_overlays.py
    :source-position: above

.. _userguide_styling_axes:

Axes
----

In this section you will learn how to change various visual properties
of Bokeh plot axes.

To set style attributes on Axis objects, use the |xaxis|, |yaxis|, and
|axis| methods on |Plot| to first obtain a plot's Axis objects:

.. code-block:: python

    >>> p.xaxis
    [<bokeh.models.axes.LinearAxis at 0x106fa2390>]

This returns a list of Axis objects (since there may be more than
one). But note that, as convenience, these lists are *splattable*,
meaning that you can set attributes directly on this result, and
the attributes will be applied to all the axes in the list:

.. code-block:: python

    p.xaxis.axis_label = "Temperature"

will change the value of ``axis_label`` for every x-axis (however
many there may be).

Below is code that will set some of the properties of axes. You can
execute this code, and try setting other properties as well.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_axis_properties.py
    :source-position: above

.. _userguide_styling_axes_labels:

Labels
~~~~~~

The text of an overall label for an axis is controlled by the ``axis_label``
property. Additionally, there are `Text Properties`_ prefixed with
``axis_label_`` that control the visual appearance of the label. For instance
to set the color of the label, set ``axis_label_text_color``. Finally, to
change the distance between the axis label and the major tick labels, set
the ``axis_label_standoff`` property:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_labels.py
    :source-position: above

.. _userguide_styling_axes_bounds:

Bounds
~~~~~~

Sometimes it is useful to limit the bounds where axes are drawn. This can be
accomplished by setting the ``bounds`` property of an axis object to a 2-tuple
of *(start, end)*:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_bounds.py
    :source-position: above

.. _userguide_styling_axes_tick_lines:

Tick Locations
~~~~~~~~~~~~~~

Bokeh has several "ticker" models that can choose nice locations for ticks.
These are configured on the ``.ticker`` property of an axis. With the
|bokeh.plotting| and |bokeh.charts| interfaces, choosing an appropriate ticker
type (categorical, datetime, linear or log scale) normally happens
automatically. However, there are cases when more explicit control is
useful.

``FixedTicker``
'''''''''''''''

This ticker model allows users to specify exact tick locations
explicitly.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_fixed_ticker.py
    :source-position: above

Tick Lines
~~~~~~~~~~

The visual appearance of the major and minor ticks is controlled by
a collection of `Line Properties`_, prefixed with ``major_tick_`` and
``minor_tick_``, respectively. For instance, to set the color of the
major ticks, use ``major_tick_line_color``. To hide either set of ticks,
set the color to ``None``. Additionally, you can control how far in and
out of the plotting area the ticks extend, with the properties
``major_tick_in``/``major_tick_out`` and ``minor_tick_in``/``minor_tick_out``.
These values are in screen units, and negative values are acceptable.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_tick_lines.py
    :source-position: above

.. _userguide_styling_axes_tick_label_formats:

Tick Label Formats
~~~~~~~~~~~~~~~~~~

The text styling of axis labels is controlled by a ``TickFormatter`` object
configured on the axis' ``formatter`` property. Bokeh uses a number of ticker
formatters by default in different situations:

* |BasicTickFormatter| --- Default formatter for  linear axes.

* |CategoricalTickFormatter| --- Default formatter for categorical axes.

* |DatetimeTickFormatter| --- Default formatter for datetime axes.

* |LogTickFormatter| --- Default formatter for log axes.

These default tick formatters do not expose many configurable properties.
To control tick formatting at a finer grained level, use one of the
|NumeralTickFormatter| or |PrintfTickFormatter| described below.

.. note::
    To replace a tick formatter on an Axis, you must set the ``formatter``
    property on an actual ``Axis`` object, not on a splattable list. This is
    why ``p.yaxis[0].formatter``, etc. (with the subscript ``[0]``) is used.

``NumeralTickFormatter``
''''''''''''''''''''''''

The |NumeralTickFormatter| has a ``format`` property that can be used
to control the text formatting of axis ticks.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_numerical_tick_formatter.py
    :source-position: above

Many additional formats are available, see the full |NumeralTickFormatter|
documentation in the :ref:`refguide`.

``PrintfTickFormatter``
'''''''''''''''''''''''

The |PrintfTickFormatter| has a ``format`` property that can be used
to control the text formatting of axis ticks using ``printf`` style
format strings.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_printf_tick_formatter.py
    :source-position: above

For full details about formats, see the full |PrintfTickFormatter|
documentation in the :ref:`refguide`.

``FuncTickFormatter``
'''''''''''''''''''''

The |FuncTickFormatter| allows tick arbitrary formatting to be performed by
supplying an anonymous JavaScript or CoffeeScript function as the ``code``
property. For convenience, there is also a ``from_py_func`` static method
that can convert python code into JavaScript automatically in many cases.
The example below demonstrates configuring a |FuncTickFormatter| from pure
JavaScript:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_func_tick_formatter.py
    :source-position: above

The above plot could also be generated by converting a python function using
``from_py_func``:

.. code-block:: python

    def ticker(tick):
        return Math.floor(tick) + " + " + (tick % 1).toFixed(2)

    p.yaxis.formatter = FuncTickFormatter.from_py_func(ticker)

.. _userguide_styling_axes_tick_label_orientation:

Tick Label Orientation
~~~~~~~~~~~~~~~~~~~~~~

The orientation of major tick labels can be controlled with the
``major_label_orientation`` property. This property accepts the
values ``"horizontal"`` or ``"vertical"`` or a floating point number
that gives the angle (in radians) to rotate from the horizontal:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_tick_label_orientation.py
    :source-position: above

----

There are more properties that Bokeh axes support configuring.
For a complete listing of all the various attributes that can be set
on different types of Bokeh axes, consult the :ref:`bokeh.models.axes`
section of the :ref:`refguide`.

.. _userguide_styling_grids:

Grids
-----

In this section you will learn how to set the visual properties of grid
lines and grid bands on Bokeh plots.

Similar to the convenience methods for axes, there are |xgrid|, |ygrid|,
and |grid| methods on |Plot| that can be used to obtain a plot's Grid
objects:

.. code-block:: python

    >>> p.grid
    [<bokeh.models.grids.Grid at 0x106fa2278>,
     <bokeh.models.grids.Grid at 0x106fa22e8>]

These methods also return splattable lists, so that you can set an attribute
on the list, as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.grid.line_dash = [4 2]

.. note::
    The ``xgrid`` property provides the grid objects that *intersect* the
    x-axis (i.e., are vertical). Correspondingly, ``ygrid`` provides
    the grid objects that intersect the y-axis (i.e., are horizontal).

.. _userguide_styling_grid_lines:

Lines
~~~~~

The visual appearance of grid lines is controlled by a collection of
`Line Properties`_, prefixed with ``grid_``. For instance, to set the
color of grid lines, use ``grid_line_color``. To hide grid lines, set
their line color to ``None``.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_grid_lines.py
    :source-position: above

Minor Lines
~~~~~~~~~~~

The visual appearance of minor grid lines is controlled by a collection of
`Line Properties`_, prefixed with ``minor_grid_``. For instance, to set the
color of grid lines, use ``minor_grid_line_color``. By default, minor grid
lines are hidden (i.e., their line color is set to ``None``).

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_minor_grid_lines.py
    :source-position: above

.. _userguide_styling_grid_bands:

Bands
~~~~~

It is also possible to display filled, shaded bands between adjacent
grid lines. The visual appearance of these bands is controlled by a
collection of `Fill Properties`_, prefixed with ``band_``. For instance,
to set the color of grid bands, use ``band_fill_color``. To hide grid
bands, set their fill color to ``None`` (this is the default).

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_grid_band_fill.py
    :source-position: above

.. _userguide_styling_grid_bounds:

Bounds
~~~~~~

Grids also support setting explicit bounds between which they are drawn.
They are set in an identical fashion to axes bounds, with a 2-tuple
of *(start, end)*:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_grid_bounds.py
    :source-position: above


----

There are other properties that Bokeh grids support configuring. For a
complete listing of all the various attributes that can be set on Bokeh
plot grids, consult the :ref:`bokeh.models.grids` section of the
:ref:`refguide`.

.. _userguide_styling_legends:

Legends
-------

Similar to the convenience methods for axes and grids, there is a
|legend| method on |Plot| that can be used to obtain a plot's |Legend|
objects:

.. code-block:: python

    >>> p.legend
    [<bokeh.models.annotations.Legend at 0x106fa2278>]

This method also returns a splattable list, so that you can set an attribute
on the list, as if it was a single object, and the attribute is changed
for every element of the list:

.. code-block:: python

    p.legend.label_text_font = "times"

.. note::
    The examples in this section use NumPy to more easily generate better
    data suitable for demonstrating legends.

Location
~~~~~~~~

The location of the legend labels is controlled by the ``location``
property.

Inside the Plot Area
''''''''''''''''''''

For legends in the to the central layout area, such as those created
automatically by ``bokeh.plotting``, values for ``location``  can be:

``"top_left"``

``"top_center"``

``"top_right"`` (the default)

``"right_center"``

``"bottom_right"``

``"bottom_center"``

``"bottom_left"``

``"left_center"``

``"center"``

or a ``(x, y)`` tuple indicating an absolute location in screen coordinates
(pixels from the bottom-left corner).

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_legend_location.py
    :source-position: above

Outside the Plot Area
'''''''''''''''''''''

It is also possible to position a legend outside the central area, by using the
``add_layout`` method of plots, but doing so requires creating the |Legend|
object directly:

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_legend_location_outside.py
    :source-position: above

In this use-case, the location must be specified absolutely. Future releases
will add additional options for laying out legend positions.

Orientation
~~~~~~~~~~~

The orientation of the legend is controlled by the ``orientation`` property.
Valid values for this property are:

``"vertical"``

``"horizontal"``

The default orientation is ``"vertical"``.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_legend_orientation.py
    :source-position: above

Label Text
~~~~~~~~~~

The visual appearance of the legend labels is controlled by a collection of
`Text Properties`_, prefixed with ``label_``. For instance, to set the font
style of the labels, use ``label_text_font_style``.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_legend_label_text.py
    :source-position: above

Border
~~~~~~

The visual appearance of the legend border is controlled by a collection of
`Line Properties`_, prefixed with ``border_``. For instance, to set the color
of the border, use ``border_line_color``. To make the border invisible, set
the border line color to ``None``.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_legend_border.py
    :source-position: above

Background
~~~~~~~~~~

The visual appearance of the legend background is controlled by a collection
of `Fill Properties`_, prefixed with ``background_``. For instance, to set the
color of the background, use ``background_fill_color``. To make the background
transparent, set the ``background_fill_alpha`` to ``0``.

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_legend_background.py
    :source-position: above

Dimensions
~~~~~~~~~~

There are several properties that can be used to control the layout,
spacing, etc. of the legend components:

.. bokeh-prop:: bokeh.models.annotations.Legend.label_standoff
.. bokeh-prop:: bokeh.models.annotations.Legend.label_width
.. bokeh-prop:: bokeh.models.annotations.Legend.label_height
.. bokeh-prop:: bokeh.models.annotations.Legend.glyph_width
.. bokeh-prop:: bokeh.models.annotations.Legend.glyph_height
.. bokeh-prop:: bokeh.models.annotations.Legend.legend_padding
.. bokeh-prop:: bokeh.models.annotations.Legend.legend_spacing

.. bokeh-plot:: source/docs/user_guide/source_examples/styling_legend_dimensions.py
    :source-position: above

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`
.. |select| replace:: :func:`~bokeh.models.plots.Plot.select`
.. |Title| replace:: :class:`~bokeh.models.annotations.Title`
.. |Legend| replace:: :class:`~bokeh.models.annotations.Legend`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |bokeh.charts|   replace:: :ref:`bokeh.charts <bokeh.charts>`
.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Range1d| replace:: :class:`~bokeh.models.ranges.Range1d`

.. |bokeh.models.formatters| replace:: :ref:`bokeh.models.formatters <bokeh.models.formatters>`
.. |BasicTickFormatter| replace:: :class:`~bokeh.models.formatters.BasicTickFormatter`
.. |CategoricalTickFormatter| replace:: :class:`~bokeh.models.formatters.CategoricalTickFormatter`
.. |DatetimeTickFormatter| replace:: :class:`~bokeh.models.formatters.DatetimeTickFormatter`
.. |FuncTickFormatter| replace:: :class:`~bokeh.models.formatters.FuncTickFormatter`
.. |LogTickFormatter| replace:: :class:`~bokeh.models.formatters.LogTickFormatter`
.. |NumeralTickFormatter| replace:: :class:`~bokeh.models.formatters.NumeralTickFormatter`
.. |PrintfTickFormatter| replace:: :class:`~bokeh.models.formatters.PrintfTickFormatter`

.. |legend| replace:: :class:`~bokeh.plotting.Figure.legend`
.. |grid|   replace:: :class:`~bokeh.plotting.Figure.grid`
.. |xgrid|  replace:: :class:`~bokeh.plotting.Figure.xgrid`
.. |ygrid|  replace:: :class:`~bokeh.plotting.Figure.ygrid`
.. |axis|   replace:: :class:`~bokeh.plotting.Figure.axis`
.. |xaxis|  replace:: :class:`~bokeh.plotting.Figure.xaxis`
.. |yaxis|  replace:: :class:`~bokeh.plotting.Figure.yaxis`
