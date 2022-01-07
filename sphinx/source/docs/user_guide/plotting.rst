.. _userguide_plotting:

Plotting with basic glyphs
==========================

.. _userguide_plotting_figures:

Creating figures
----------------

Bokeh plots you create with the |bokeh.plotting| interface come with a default
set of tools and visual styles. For information on how to customize the visual
style of plots, see :ref:`userguide_styling`. For information about changing or
specifying tools, see :ref:`userguide_tools`.

.. _userguide_plotting_scatter_markers:

Scatter markers
~~~~~~~~~~~~~~~

Bokeh includes a large variety of markers for creating scatter plots. For
example, to render circle scatter markers on a plot, use the |circle| method of
|figure|:

.. bokeh-plot:: docs/user_guide/examples/plotting_scatter_circle.py
    :source-position: above

Similarly, use the |square| method of |figure| to scatter square markers
on a plot:

.. bokeh-plot:: docs/user_guide/examples/plotting_scatter_square.py
    :source-position: above

Bokeh's built-in scatter markers consist of a set of base markers, most of which
can be combined with different kinds of additional visual features. This is an
overview of all available scatter markers:

.. bokeh-plot:: docs/user_guide/examples/plotting_markertypes.py
    :source-position: none

To see details and example plots for any of the available scatter markers, click
on the corresponding glyph method in the following list:

.. hlist::
    :columns: 3

    * |asterisk|
    * |circle|
    * |circle_cross|
    * |circle_dot|
    * |circle_x|
    * |circle_y|
    * |cross|
    * |dash|
    * |dot|
    * |diamond|
    * |diamond_cross|
    * |diamond_dot|
    * |hex|
    * |hex_dot|
    * |inverted_triangle|
    * |plus|
    * |square|
    * |square_cross|
    * |square_dot|
    * |square_pin|
    * |square_x|
    * |star|
    * |star_dot|
    * |triangle|
    * |triangle_dot|
    * |triangle_pin|
    * |x|
    * |y|

All the markers have the same set of properties: ``x``, ``y``, ``size`` (in
|screen units|), and ``angle`` (in radians by default). The |circle| marker is
an exception: this method accepts an additional ``radius`` property that you can
use with |data units|.

.. _userguide_plotting_line_glyphs:

Line glyphs
~~~~~~~~~~~

Single lines
''''''''''''

The example below shows how to generate a single line glyph from
one-dimensional sequences of ``x`` and ``y`` points using the |line| glyph
method:

.. bokeh-plot:: docs/user_guide/examples/plotting_line_single.py
    :source-position: above

Step lines
''''''''''

For some kinds of data, discrete steps between data points may work better than
linear segments. To produce this type of data representation, use the |step|
glyph method.

.. bokeh-plot:: docs/user_guide/examples/plotting_line_steps.py
    :source-position: above

Adjust the ``mode`` parameter to draw step levels with the x-coordinates
before, after, or in the middle of each step.

.. _userguide_plotting_line_glyphs_multi:

Multiple lines
''''''''''''''

If you want to draw multiple lines in one go, use the |multi_line| glyph
method as follows:

.. bokeh-plot:: docs/user_guide/examples/plotting_line_multiple.py
    :source-position: above

.. note::
    Unlike many other glyph methods, |multi_line| accepts a list of lists of
    ``x`` and ``y`` positions for each line. The |multi_line| method also
    expects a scalar value or a list of scalars for each line for parameters
    such as color, alpha, and line width. You can similarly use a
    ``ColumnDataSource`` consisting of a list of lists of point coordinates
    and a list of scalar values of matching length.

Missing points
''''''''''''''

You can pass ``NaN`` values to |line| and |multi_line| glyphs. This produces
disjointed lines with gaps for ``NaN`` values.

.. bokeh-plot:: docs/user_guide/examples/plotting_line_missing_points.py
    :source-position: above

Stacked lines
'''''''''''''

You may wish to stack lines with a common index when working with time series
of percentages and other similar data. To do so, you can use the |vline_stack|
and |hline_stack| convenience methods.

.. bokeh-plot:: docs/user_guide/examples/plotting_vline_stack.py
    :source-position: above

.. note::
    This and other examples in this chapter rely on ```ColumnDataSource`` for
    data structuring. For information on how to work with this data structure,
    see :ref:`userguide_data`.

.. _userguide_plotting_bars_rects:

Bars and rectangles
~~~~~~~~~~~~~~~~~~~

Bars
''''

To make drawing rectangular bars more convenient, Bokeh provides |hbar| and
|vbar| glyph functions that combine the coordinate systems above.

To draw vertical bars by specifying a center x-coordinate, width, and top and
bottom endpoints, use the |vbar| glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_vbar.py
    :source-position: above

To draw horizontal bars by specifying a center y-coordinate, height, and left
and right endpoints, use the |hbar| glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_hbar.py
    :source-position: above

Stacked bars
''''''''''''

To stack the bars, you can use the |vbar_stack| and |hbar_stack| convenience
methods.

.. bokeh-plot:: docs/user_guide/examples/plotting_hbar_stack.py
    :source-position: above

For more examples of stacked bars, see :ref:`userguide_categorical`.

Rectangles
''''''''''

To draw *axis aligned* rectangles by specifying the ``left``, ``right``,
``top``, and ``bottom`` positions, use the |quad| glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_rectangles_quad.py
    :source-position: above

To draw *axis aligned* rectangles by specifying the ``x`` and ``y``
coordinates for a corner, and a ``width`` and ``height``, use the |block|
glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_rectangles_block.py
    :source-position: above

To draw arbitrary rectangles by specifying center coordinates, ``width``,
``height``, and ``angle``, use the |rect| glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_rectangles_rect.py
    :source-position: above

.. _userguide_plotting_hex:

Hex tiles
~~~~~~~~~

Bokeh can plot hexagonal tiles, which you can use to show binned aggregations
and more. The :func:`~bokeh.plotting.figure.hex_tile` method takes a ``size``
parameter to define the size of the hex grid and `axial coordinates`_ to
specify the tiles.

.. bokeh-plot:: docs/user_guide/examples/plotting_hex_tile_basic.py
    :source-position: above

A more practical example below computes counts per bin using the
:func:`~bokeh.util.hex.hexbin` function and plots the color mapped counts.

.. bokeh-plot:: docs/user_guide/examples/plotting_hex_tile_binning.py
    :source-position: above

You can simplify this code by calling the :func:`~bokeh.plotting.figure.hexbin`
method of |figure|.

.. _userguide_plotting_directed_areas:

Directed areas
~~~~~~~~~~~~~~

Directed areas are filled regions between two series that share a common index.
For instance, a vertical directed area has one ``x`` coordinate array and two
``y`` coordinate arrays, ``y1`` and ``y2``, defining the space for Bokeh to
fill.

Single areas
''''''''''''

To fill an area in vertical direction, use the |varea| method. You can do the
same in horizontal direction with |harea|.

.. bokeh-plot:: docs/user_guide/examples/plotting_varea.py
    :source-position: above

Stacked areas
'''''''''''''

To stack directed areas, use the |varea_stack| and |harea_stack| convenience
methods.

.. bokeh-plot:: docs/user_guide/examples/plotting_varea_stack.py
    :source-position: above

.. _userguide_plotting_patch_polygon_glyphs:

Patches and polygons
~~~~~~~~~~~~~~~~~~~~

Single patches
''''''''''''''

The following example generates a single polygonal patch from one-dimensional
sequences of ``x`` and ``y`` points using the |patch| glyph method:

.. bokeh-plot:: docs/user_guide/examples/plotting_patch_single.py
    :source-position: above

Multiple patches
''''''''''''''''

To plot several polygonal patches, use the |patches| glyph method:

.. bokeh-plot:: docs/user_guide/examples/plotting_patch_multiple.py
    :source-position: above

.. note::
    Unlike many other glyph methods, |patches| accepts a list of lists of ``x``
    and ``y`` positions for each line. The |patches| method also expects a
    scalar value or a list of scalars for each patch for parameters such as
    color, alpha, and line width. You can similarly use a ``ColumnDataSource``
    consisting of a list of lists of point coordinates and a list of scalar
    values of matching length.

Missing points
''''''''''''''

Just as with the |line| and |multi_line| methods, you can pass ``NaN`` values
to |patch| and |patches| glyphs. This produces disjointed patches with gaps
for ``NaN`` values.

.. bokeh-plot:: docs/user_guide/examples/plotting_patch_missing_points.py
    :source-position: above

.. warning::
    Bokeh doesn't currently support hit testing on patch objects with ``NaN``
    values.

.. _userguide_plotting_multipolygons:

Polygons
~~~~~~~~

The |multi_polygons| glyph uses nesting to accept a variety of information
relevant to polygons. The method duplicates the functionality of |patches| but
you can also use it to render holes inside polygons.

.. note::
    Unlike many other glyph methods, |multi_polygons| accepts a triple-nested
    lists of ``x`` and ``y`` positions for the exterior and holes composing
    each polygon. The |multi_polygons| method also expects a scalar value or a
    list of scalars for each item for parameters such as color, alpha, and line
    width. You can similarly use a ``ColumnDataSource`` consisting of a triple-
    nested list of point coordinates and a list of scalars, with the top-level
    list of point coordinates being of equal length with the list of scalars.

Simple polygon
''''''''''''''

The following example generates a single polygon from a triple-nested list of
one-dimensional sequences of ``x`` and ``y`` points using the |multi_polygons|
glyph method.

.. bokeh-plot:: docs/user_guide/examples/plotting_multipolygon_simple.py
    :source-position: above

Polygon with holes
''''''''''''''''''

The following example generates a single polygon with holes from three
sequences of ``x`` and ``y`` points. The first sequence represents
the exterior of the polygon and the following sequences represent the holes.

.. bokeh-plot:: docs/user_guide/examples/plotting_multipolygon_with_holes.py
    :source-position: above

Multi-polygon with separate parts
'''''''''''''''''''''''''''''''''

A single polygon concept can comprise multiple polygon geometries. The
following example generates a multi-polygon glyph from several sequences of
``x`` and ``y`` points. Each item in the sequence represents a part of the
glyph.

.. bokeh-plot:: docs/user_guide/examples/plotting_multipolygon_with_separate_parts.py
    :source-position: above

Multiple multi-polygons
'''''''''''''''''''''''

The top-level of nesting separates each multi-polygon from the rest. You can
think of each multi-polygon as a row in the data source, potentially with a
corresponding label or color.

.. bokeh-plot:: docs/user_guide/examples/plotting_multipolygons.py
    :source-position: above

.. _userguide_plotting_ellipses:

Ellipses
~~~~~~~~

The |ellipse| glyph method accepts the same properties as |rect|, but renders
ellipse shapes.

.. bokeh-plot:: docs/user_guide/examples/plotting_ellipses.py
    :source-position: above


.. _userguide_plotting_images:

Images
~~~~~~

You can display images on Bokeh plots using the |image|, |image_rgba|, and
|image_url| glyph methods. You can use hovering tooltips with image glyphs
to let the user see the values of each pixel. For more information on how to
enable hovering tooltips for images, see
:ref:`Image hover <userguide_tools_image_hover>`.

.. _userguide_plotting_images_rgba:

Raw RGBA data
'''''''''''''

The following example shows how to display images using raw RGBA data with the
|image_rgba| method.

.. bokeh-plot:: docs/user_guide/examples/plotting_image_rgba.py
    :source-position: above

.. _userguide_plotting_images_colormapped:

Color mapped images
'''''''''''''''''''

The following example shows how to supply an array of *scalar values* and have
Bokeh automatically color map the data in the browser with the |image| glyph
method.

.. bokeh-plot:: docs/user_guide/examples/plotting_image.py
    :source-position: above

Note that this example sets the render level to ``"image"``. Normally, Bokeh
draws all glyphs *above* grid lines, but with this render level they appear
*below* the grid lines.

.. _userguide_plotting_segments_rays:

Segments and rays
~~~~~~~~~~~~~~~~~

To draw multiple individual line segments use the |segment| and |ray| glyph
methods.

The |segment| method accepts the starting points ``x0`` and ``y0`` and end
points ``x1`` and ``y1``. It renders segments between those points.

.. bokeh-plot:: docs/user_guide/examples/plotting_segments.py
    :source-position: above

The |ray| method accepts the starting points ``x`` and ``y`` with a ``length``
(in |screen units|) and an ``angle``. The ``angle_units`` parameter defaults to
``"rad"`` but you can also set it to ``"deg"`` to have the angle measured in
degrees instead of radians. To have an "infinite" ray that always extends to the
edge of the plot, set ``length`` to ``0``.

.. bokeh-plot:: docs/user_guide/examples/plotting_ray.py
    :source-position: above

.. _userguide_plotting_wedges_arcs:

Wedges and arcs
~~~~~~~~~~~~~~~

To draw a simple line arc, use the |arc| glyph method, which accepts
``radius``, ``start_angle``, and ``end_angle`` to determine position.
Additionally, the ``direction`` property determines whether to render
clockwise (``"clock"``) or anti-clockwise (``"anticlock"``) between the start
and end angles.

.. bokeh-plot:: docs/user_guide/examples/plotting_arcs.py
    :source-position: above

The |wedge| glyph method accepts the same properties as |arc| but renders a
filled wedge instead:

.. bokeh-plot:: docs/user_guide/examples/plotting_wedge.py
    :source-position: above

The |annular_wedge| glyph method is similar to |wedge| but leaves an inner
portion of the wedge hollow. It accepts an ``inner_radius`` and
``outer_radius`` instead of just ``radius``.

.. bokeh-plot:: docs/user_guide/examples/plotting_annular_wedge.py
    :source-position: above

Finally, the |annulus| glyph method also accepts ``inner_radius`` and
``outer_radius`` to produce hollow circles.

.. bokeh-plot:: docs/user_guide/examples/plotting_annulus.py
    :source-position: above

.. _userguide_plotting_quadratic_cubic_curves:

Specialized curves
~~~~~~~~~~~~~~~~~~

To draw parameterized quadratic and cubic curves, use the |quadratic| and
|bezier| glyph methods. For more detail on these curves, see
:ref:`reference documentation <bokeh.plotting>`.

.. _userguide_plotting_multiple_glyphs:

Combining multiple glyphs
-------------------------

You can combine multiple glyphs on a single plot by calling their methods on a
single |figure|.

.. bokeh-plot:: docs/user_guide/examples/plotting_multiple_glyphs.py
    :source-position: above

This principle applies to all |bokeh.plotting| glyph methods. You can add as
many glyphs to a Bokeh plot as you want.

.. _userguide_plotting_setting_ranges:

Setting ranges
--------------

By default, Bokeh attempts to automatically set the data bounds of plots to fit
snugly around the data. You may, however, need to set a plot's range
explicitly. To do so, set the ``x_range`` and/or ``y_range`` properties using a
``Range1d`` object that lets you set the *start* and *end* points of the range
you want.

.. code-block:: python

    p.x_range = Range1d(0, 100)

For convenience, the |figure| function can also accept *(start, end)* tuples as
values for the ``x_range`` or ``y_range`` parameters. Here's how you can use
both methods to set a range:

.. bokeh-plot:: docs/user_guide/examples/plotting_figure_range.py
    :source-position: above

Ranges also have a ``bounds`` property that lets you specify the limits of the
plot beyond which the user cannot pan or zoom.

.. code-block:: python

    # set a range using a Range1d
    p.y_range = Range1d(0, 15, bounds=(0, None))

.. _userguide_plotting_axis_types:

Specifying axis types
---------------------

All the examples above use the default linear axis. This axis is suitable for
plots that need to show numerical data on a linear scale. However, you may have
categorical data or need to display numerical data on a datetime or log scale.
This section shows you how to specify the axis type when using the
|bokeh.plotting| interface.

.. _userguide_plotting_categorical_axes:

Categorical axes
~~~~~~~~~~~~~~~~

To create a categorical axis, specify a
:class:`~bokeh.models.ranges.FactorRange` for one of the plot's ranges or a
list of factors to be converted to one. Here's an example:

.. bokeh-plot:: docs/user_guide/examples/plotting_categorical_axis.py
    :source-position: above

.. _userguide_plotting_datetime_axes:

For complete details, see :ref:`userguide_categorical`.

Datetime axes
~~~~~~~~~~~~~

.. note::
    The example in this section requires a network connection and depends on
    the open source Pandas library to present realistic time series data.

For time series, or any data that involves dates or time, you may want to
use axes with labels suitable for different date and time scales.

The |figure| function accepts ``x_axis_type`` and ``y_axis_type`` as arguments.
To specify a datetime axis, pass ``"datetime"`` for the value of either of
these parameters.

.. bokeh-plot:: docs/user_guide/examples/plotting_datetime_axis.py
    :source-position: above

.. note::
    Future versions of Bokeh will attempt to auto-detect situations when
    datetime axes are appropriate and add them automatically.

.. _userguide_plotting_log_axes:

Log scale axes
~~~~~~~~~~~~~~

Data that grows exponentially or covers many orders of magnitude often requires
one axis to be on a log scale. For data that has a power law relationship, you
may want to use log scales on both axes.

You can use the same |figure| arguments, ``x_axis_type`` and ``y_axis_type``,
to set one or both of the axes to ``"log"``.

By default, Bokeh calculates log axis ranges to fit around positive value data.
For information on how to set your own ranges, see
:ref:`userguide_plotting_setting_ranges`.

.. bokeh-plot:: docs/user_guide/examples/plotting_log_scale_axis.py
    :source-position: above

.. _userguide_plotting_twin_axes:

Twin axes
~~~~~~~~~

You can add multiple axes representing different ranges to a single plot. To do
this, configure the plot with "extra" named ranges in the ``extra_x_range`` and
``extra_y_range`` properties. You can then refer to these named ranges when
adding new glyph methods as well as when adding new axis objects with the
``add_layout`` method of the |plot|. Here's an example:

.. bokeh-plot:: docs/user_guide/examples/plotting_twin_axes.py
    :source-position: above

.. _axial coordinates: https://www.redblobgames.com/grids/hexagons/#coordinates-axial

.. |annular_wedge|     replace:: :func:`~bokeh.plotting.figure.annular_wedge`
.. |annulus|           replace:: :func:`~bokeh.plotting.figure.annulus`
.. |arc|               replace:: :func:`~bokeh.plotting.figure.arc`
.. |asterisk|          replace:: :func:`~bokeh.plotting.figure.asterisk`
.. |bezier|            replace:: :func:`~bokeh.plotting.figure.bezier`
.. |block|             replace:: :func:`~bokeh.plotting.figure.block`
.. |circle|            replace:: :func:`~bokeh.plotting.figure.circle`
.. |circle_cross|      replace:: :func:`~bokeh.plotting.figure.circle_cross`
.. |circle_dot|        replace:: :func:`~bokeh.plotting.figure.circle_dot`
.. |circle_x|          replace:: :func:`~bokeh.plotting.figure.circle_x`
.. |circle_y|          replace:: :func:`~bokeh.plotting.figure.circle_y`
.. |cross|             replace:: :func:`~bokeh.plotting.figure.cross`
.. |dash|              replace:: :func:`~bokeh.plotting.figure.dash`
.. |diamond|           replace:: :func:`~bokeh.plotting.figure.diamond`
.. |diamond_cross|     replace:: :func:`~bokeh.plotting.figure.diamond_cross`
.. |diamond_dot|       replace:: :func:`~bokeh.plotting.figure.diamond_dot`
.. |dot|               replace:: :func:`~bokeh.plotting.figure.dot`
.. |ellipse|           replace:: :func:`~bokeh.plotting.figure.ellipse`
.. |harea|             replace:: :func:`~bokeh.plotting.figure.harea`
.. |harea_stack|       replace:: :func:`~bokeh.plotting.figure.harea_stack`
.. |hbar_stack|        replace:: :func:`~bokeh.plotting.figure.hbar_stack`
.. |hex|               replace:: :func:`~bokeh.plotting.figure.hex`
.. |hex_dot|           replace:: :func:`~bokeh.plotting.figure.hex_dot`
.. |hline_stack|       replace:: :func:`~bokeh.plotting.figure.hline_stack`
.. |inverted_triangle| replace:: :func:`~bokeh.plotting.figure.inverted_triangle`
.. |image|             replace:: :func:`~bokeh.plotting.figure.image`
.. |image_rgba|        replace:: :func:`~bokeh.plotting.figure.image_rgba`
.. |image_url|         replace:: :func:`~bokeh.plotting.figure.image_url`
.. |line|              replace:: :func:`~bokeh.plotting.figure.line`
.. |multi_line|        replace:: :func:`~bokeh.plotting.figure.multi_line`
.. |multi_polygons|    replace:: :func:`~bokeh.plotting.figure.multi_polygons`
.. |patch|             replace:: :func:`~bokeh.plotting.figure.patch`
.. |patches|           replace:: :func:`~bokeh.plotting.figure.patches`
.. |plus|              replace:: :func:`~bokeh.plotting.figure.plus`
.. |quad|              replace:: :func:`~bokeh.plotting.figure.quad`
.. |quadratic|         replace:: :func:`~bokeh.plotting.figure.quadratic`
.. |ray|               replace:: :func:`~bokeh.plotting.figure.ray`
.. |rect|              replace:: :func:`~bokeh.plotting.figure.rect`
.. |segment|           replace:: :func:`~bokeh.plotting.figure.segment`
.. |step|              replace:: :func:`~bokeh.plotting.figure.step`
.. |square|            replace:: :func:`~bokeh.plotting.figure.square`
.. |square_cross|      replace:: :func:`~bokeh.plotting.figure.square_cross`
.. |square_dot|        replace:: :func:`~bokeh.plotting.figure.square_dot`
.. |square_pin|        replace:: :func:`~bokeh.plotting.figure.square_pin`
.. |square_x|          replace:: :func:`~bokeh.plotting.figure.square_x`
.. |star|              replace:: :func:`~bokeh.plotting.figure.star`
.. |star_dot|          replace:: :func:`~bokeh.plotting.figure.star_dot`
.. |triangle|          replace:: :func:`~bokeh.plotting.figure.triangle`
.. |triangle_dot|      replace:: :func:`~bokeh.plotting.figure.triangle_dot`
.. |triangle_pin|      replace:: :func:`~bokeh.plotting.figure.triangle_pin`
.. |varea|             replace:: :func:`~bokeh.plotting.figure.varea`
.. |varea_stack|       replace:: :func:`~bokeh.plotting.figure.varea_stack`
.. |vbar_stack|        replace:: :func:`~bokeh.plotting.figure.vbar_stack`
.. |vline_stack|       replace:: :func:`~bokeh.plotting.figure.vline_stack`
.. |wedge|             replace:: :func:`~bokeh.plotting.figure.wedge`
.. |x|                 replace:: :func:`~bokeh.plotting.figure.x`
.. |y|                 replace:: :func:`~bokeh.plotting.figure.y`
