.. _userguide_plotting:

Plotting with Basic Glyphs
==========================

.. _userguide_plotting_figures:

Creating Figures
----------------

Note that Bokeh plots created using the |bokeh.plotting| interface come with
a default set of tools and default visual styles. See :ref:`userguide_styling`
for information about how to customize the visual style of plots, and
:ref:`userguide_tools` for information about changing or specifying tools.

.. _userguide_plotting_scatter_markers:

Scatter Markers
~~~~~~~~~~~~~~~

To scatter circle markers on a plot, use the |circle| method of |Figure|:

.. bokeh-plot:: docs/user_guide/examples/plotting_scatter_circle.py
    :source-position: above

Similarly, to scatter square markers, use the |square| method of |Figure|:

.. bokeh-plot:: docs/user_guide/examples/plotting_scatter_square.py
    :source-position: above

There are lots of marker types available in Bokeh, you can see details and
example plots for all of them by clicking on entries in the list below:

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
    * |triangle|
    * |triangle_dot|
    * |triangle_pin|
    * |x|
    * |y|

All the markers have the same set of properties: ``x``, ``y``, ``size`` (in
:ref:`screen units <userguide_styling_units>`), and ``angle`` (radians by
default). Additionally, |circle| has a ``radius`` property that can be used to
specify :ref:`data-space units <userguide_styling_units>`.

.. _userguide_plotting_line_glyphs:

Line Glyphs
~~~~~~~~~~~

Single Lines
''''''''''''

Below is an example that shows how to generate a single line glyph from
one-dimensional sequences of *x* and *y* points using the |line| glyph
method:

.. bokeh-plot:: docs/user_guide/examples/plotting_line_single.py
    :source-position: above

Step Lines
''''''''''

For some kinds of data, it may be more appropriate to draw discrete steps
between data points, instead of connecting points with linear segments. The
|step| glyph method can be used to accomplish this:

.. bokeh-plot:: docs/user_guide/examples/plotting_line_steps.py
    :source-position: above

Step levels can be drawn before, after, or centered on the x-coordinates,
as configured by the ``mode`` parameter.

Multiple Lines
''''''''''''''

Sometimes it is useful to plot multiple lines all at once. This can be
accomplished with the |multi_line| glyph method:

.. bokeh-plot:: docs/user_guide/examples/plotting_line_multiple.py
    :source-position: above

.. note::
    This glyph is unlike most other glyphs. Instead of accepting a
    one-dimensional list or array of scalar values, it accepts a "list of lists"
    for x and y positions of each line, parameters xs and ys. multi_line
    also expects a scalar value or a list of scalers per each line for
    parameters such as color, alpha, linewidth, etc. Similarly, a
    ColumnDataSource may be used consisting of a "list of lists" and a
    list of scalars where the length of the list of scalars and length of
    lists must match.

Missing Points
''''''''''''''

``NaN`` values can be passed to |line| and |multi_line| glyphs. In this case,
you end up with single logical line objects, that have multiple disjoint
components when rendered:

.. bokeh-plot:: docs/user_guide/examples/plotting_line_missing_points.py
    :source-position: above

Stacked Lines
'''''''''''''

In some instances, it is desirable to stack lines that are aligned on a common
index (e.g. time series of percentages). The |vline_stack| and |hline_stack|
convenience methods can be used to accomplish this. Note that these methods
stack columns from an explicitly supplied ``ColumnDataSource`` (see the section
:ref:`userguide_data` for more information.

.. bokeh-plot:: docs/user_guide/examples/plotting_vline_stack.py
    :source-position: above

.. _userguide_plotting_bars_rects:

Bars and Rectangles
~~~~~~~~~~~~~~~~~~~

Bars
''''

When drawing rectangular bars (often representing intervals), it is often
more convenient to have coordinates that are a hybrid of the two systems
above. Bokeh provides the |hbar| and |vbar| glyphs function for this
purpose.

To draw vertical bars by specifying a (center) x-coordinate, width, and
top and bottom endpoints, use the |vbar| glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_vbar.py
    :source-position: above

To draw horizontal bars by specifying a (center) y-coordinate, height,
and left and right endpoints, use the |hbar| glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_hbar.py
    :source-position: above

Stacked Bars
''''''''''''

It is often desirable to stack bars. This can be accomplished with the
|vbar_stack| and |hbar_stack| convenience methods. Note that these methods
stack columns from an explicitly supplied ``ColumnDataSource`` (see the section
:ref:`userguide_data` for more information).

.. bokeh-plot:: docs/user_guide/examples/plotting_hbar_stack.py
    :source-position: above

More examples of stacked bars can be found in the section
:ref:`userguide_categorical`.

Rectangles
''''''''''

To draw *axis aligned* rectangles ("quads") by specifying the ``left``,
``right``, ``top``, and ``bottom`` positions, use the |quad| glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_rectangles.py
    :source-position: above

To draw arbitrary rectangles by specifying a center point, width, height,
and angle, use the |rect| glyph function:

.. bokeh-plot:: docs/user_guide/examples/plotting_rectangles_rotated.py
    :source-position: above

.. userguide_plotting_hex

Hex Tiles
~~~~~~~~~

Bokeh can plot hexagonal tiles, which are often used for showing binned
aggregations. The :func:`~bokeh.plotting.Figure.hex_tile` method
takes a `size` parameter to define the size of the hex grid, and
`axial coordinates`_ to specify which tiles are present.

.. bokeh-plot:: docs/user_guide/examples/plotting_hex_tile_basic.py
    :source-position: above

A more realistic example below computes counts per bin using the
:func:`~bokeh.util.hex.hexbin` function and plots the colormapped counts:

.. bokeh-plot:: docs/user_guide/examples/plotting_hex_tile_binning.py
    :source-position: above

The above code can be made even simpler by calling the :func:`~bokeh.plotting.Figure.hexbin`
method of ``Figure``.

.. _userguide_plotting_directed_areas:

Directed Areas
~~~~~~~~~~~~~~

Directed areas are filled regions between two series that share a common index.
For instance, a vertical directed area has one `x` coordinate array, and two y
coordinate arrays, `y1` and `y2`, which will be filled between.

Single Areas
''''''''''''

A single directed area between two aligned series can be created in the
vertical direction with |varea| or in the horizontal direction with
|harea|.

.. bokeh-plot:: docs/user_guide/examples/plotting_varea.py
    :source-position: above

Stacked Areas
'''''''''''''

It is often desirable to stack directed areas. This can be accomplished with
the |varea_stack| and |harea_stack| convenience methods. Note that these methods
stack columns from an explicitly supplied ``ColumnDataSource`` (see the section
:ref:`userguide_data` for more information).

.. bokeh-plot:: docs/user_guide/examples/plotting_varea_stack.py
    :source-position: above

.. _userguide_plotting_patch_polygon_glyphs:

Patches and Polygons
~~~~~~~~~~~~~~~~~~~~

Single Patches
''''''''''''''

Below is an example that shows how to generate a single polygonal patch
glyph from one-dimensional sequences of *x* and *y* points using the
|patch| glyph method:

.. bokeh-plot:: docs/user_guide/examples/plotting_patch_single.py
    :source-position: above

Multiple Patches
''''''''''''''''

Sometimes it is useful to plot multiple polygonal patches all at once.
This can be accomplished with the |patches| glyph method:

.. bokeh-plot:: docs/user_guide/examples/plotting_patch_multiple.py
    :source-position: above

.. note::
    This glyph is unlike most other glyphs. Instead of accepting a
    one-dimensional list or array of scalar values, it accepts a "list
    of lists" for x and y positions of each patch, parameters xs and ys.
    patches also expects a scalar value or a list of scalers per each
    patch for parameters such as color, alpha, linewidth, etc. Similarly,
    a ColumnDataSource may be used consisting of a "list of lists" and a
    list of scalars where the length of the list of scalars and length of
    lists must match.

Missing Points
''''''''''''''

Just as with |line| and |multi_line|, ``NaN`` values can be passed to
|patch| and |patches| glyphs. In this case, you end up with single logical
patch objects, that have multiple disjoint components when rendered:

.. bokeh-plot:: docs/user_guide/examples/plotting_patch_missing_points.py
    :source-position: above

.. warning::
    Hit testing on patch objects with ``NaN`` values is not currently
    supported.

.. _userguide_plotting_multipolygons:

Polygons with Holes
~~~~~~~~~~~~~~~~~~~

The |multi_polygons| glyph uses nesting to accept a variety of information
relevant to polygons. Anything that can be rendered as a |Patches| can also be
rendered as |multi_polygons|, but additionally, |multi_polygons| can render
holes inside each polygon.

.. note::
    This glyph is unlike most other glyphs. Instead of accepting a one-dimensional
    list or array of scalar values, it accepts a 3 times nested
    list of x and y positions for the exterior and holes composing each
    polygon. MultiPolygons also expects a scalar value or a list of scalers
    per each item for parameters such as color, alpha, linewidth, etc.
    Similarly, one can use a ColumnDataSource consisting of a 3 times nested
    list and a list of scalars where the length of the list of scalars and
    length of the top level list must match.

Simple Polygon
''''''''''''''

Below is an example that shows how to generate a single polygon
glyph from 3 times nested one-dimensional sequences of *x* and *y* points
using the |multi_polygons| glyph method:

.. bokeh-plot:: docs/user_guide/examples/plotting_multipolygon_simple.py
    :source-position: above

Polygon with Holes
''''''''''''''''''

Below is an example that shows how to generate a single polygon with holes
from three sequences of *x* and *y* points. The first sequence represents
the exterior of the polygon and the following sequences represent the holes:

.. bokeh-plot:: docs/user_guide/examples/plotting_multipolygon_with_holes.py
    :source-position: above

MultiPolygon with Separate Parts
''''''''''''''''''''''''''''''''

Sometimes one conceptual polygon is composed of multiple polygon geometries.
Below is an example that shows how to generate a MultiPolygon
glyph from several sequences of *x* and *y* points. Each item in the sequence
represents a part of the MultiPolygon:

.. bokeh-plot:: docs/user_guide/examples/plotting_multipolygon_with_separate_parts.py
    :source-position: above

Multiple MultiPolygons
''''''''''''''''''''''

The top-level of nesting is used to separate each MultiPolygon from the
others. Each MultiPolygon can be thought of as a row in the data source -
potentially with a corresponding label or color.

.. bokeh-plot:: docs/user_guide/examples/plotting_multipolygons.py
    :source-position: above

.. _userguide_plotting_ellipses:

Ellipses
~~~~~~~~

The |ellipse| glyph method accepts the same properties as |rect|, but renders
ellipse shapes:

.. bokeh-plot:: docs/user_guide/examples/plotting_ellipses.py
    :source-position: above


.. _userguide_plotting_images:

Images
~~~~~~

You can display images on Bokeh plots using the |image|, |image_rgba|, and
|image_url| glyph methods. It is possible to use a hover tool with image glyphs
to allow for interactive inspection of the values of any pixel. For more
information on how to enable hover with images, please consult the
:ref:`Image Hover section <userguide_tools_image_hover>` of the User's Guide.

.. _userguide_plotting_images_rgba:

Raw RGBA data
'''''''''''''

The first example here shows how to display images in Bokeh plots from
raw RGBA data using |image_rgba|:

.. bokeh-plot:: docs/user_guide/examples/plotting_image_rgba.py
    :source-position: above

.. _userguide_plotting_images_colormapped:

Colormapped Images
''''''''''''''''''

It is also possible to provide an array of *scalar values*, and have Bokeh
automatically colormap the data in the browser by using the |image| glyph
method. The next example shows how to do this:

.. bokeh-plot:: docs/user_guide/examples/plotting_image.py
    :source-position: above

Also note that in the above example we have set the render level to ``"image"``.
Normally, all glyphs are drawn *above* grid lines, but setting the ``"image"``
render level can be used to draw *underneath* the grid lines.

.. _userguide_plotting_segments_rays:

Segments and Rays
~~~~~~~~~~~~~~~~~

Sometimes it is useful to be able to draw many individual line segments at
once. Bokeh provides the |segment| and |ray| glyph methods to render these.

The |segment| function accepts start points ``x0``, ``y0`` and end points
``x1`` and ``y1`` and renders segments between these:

.. bokeh-plot:: docs/user_guide/examples/plotting_segments.py
    :source-position: above

The |ray| function accepts start points ``x``, ``y`` with a ``length``
(in :ref:`screen units <userguide_styling_units>`) and an ``angle``. The default
``angle_units`` are ``"rad"`` but can also be changed to ``"deg"``. To have an
"infinite" ray, that always extends to the edge of the plot, specify ``0`` for
the length:

.. bokeh-plot:: docs/user_guide/examples/plotting_ray.py
    :source-position: above

.. _userguide_plotting_wedges_arcs:

Wedges and Arcs
~~~~~~~~~~~~~~~

To draw a simple line arc, Bokeh provides the |arc| glyph method, which
accepts ``radius``, ``start_angle``, and ``end_angle`` to determine position.
Additionally, the ``direction`` property determines whether to render
clockwise (``"clock"``) or anti-clockwise (``"anticlock"``) between the start
and end angles.

.. bokeh-plot:: docs/user_guide/examples/plotting_arcs.py
    :source-position: above

The |wedge| glyph method accepts the same properties as |arc|, but renders a
filled wedge instead:

.. bokeh-plot:: docs/user_guide/examples/plotting_wedge.py
    :source-position: above

The |annular_wedge| glyph method is similar to |arc|, but draws a filled area.
It accepts an ``inner_radius`` and ``outer_radius`` instead of just ``radius``:

.. bokeh-plot:: docs/user_guide/examples/plotting_annular_wedge.py
    :source-position: above

Finally, the |annulus| glyph methods, which accepts ``inner_radius`` and
``outer_radius``, can be used to draw filled rings:

.. bokeh-plot:: docs/user_guide/examples/plotting_annulus.py
    :source-position: above

.. _userguide_plotting_quadratic_cubic_curves:

Specialized Curves
~~~~~~~~~~~~~~~~~~

Bokeh also provides |quadratic| and |bezier| glyph methods for drawing
parameterized quadratic and cubic curves. These are somewhat uncommon;
please refer to the :ref:`reference documentation <bokeh.plotting>` for details.

.. _userguide_plotting_multiple_glyphs:

Combining Multiple Glyphs
-------------------------

Combining multiple glyphs on a single plot is a matter of calling more than
one glyph method on a single |Figure|:

.. bokeh-plot:: docs/user_guide/examples/plotting_multiple_glyphs.py
    :source-position: above

This principle holds in general for all the glyph methods in
|bokeh.plotting|. Any number of glyphs may be added to a Bokeh
plot.

.. _userguide_plotting_setting_ranges:

Setting Ranges
--------------

By default, Bokeh will attempt to automatically set the data bounds
of plots to fit snugly around the data. Sometimes, you may need to
set a plot's range explicitly. This can be accomplished by setting the
``x_range`` or ``y_range`` properties using a ``Range1d`` object that
gives the *start* and *end* points of the range you want:

.. code-block:: python

    p.x_range = Range1d(0, 100)

As a convenience, the |figure| function can also accept tuples of
*(start, end)* as values for the ``x_range`` or ``y_range`` parameters.
Below is an example that shows both methods of setting the range:

.. bokeh-plot:: docs/user_guide/examples/plotting_figure_range.py
    :source-position: above

Ranges also have a ``bounds`` property that allows you to specify limits of
the plot that you do not want the user to be able to pan/zoom beyond.

.. code-block:: python

    # set a range using a Range1d
    p.y_range = Range1d(0, 15, bounds=(0, None))

.. _userguide_plotting_axis_types:

Specifying Axis Types
---------------------

All the examples above use the default linear axis. This axis is suitable
for many plots that need to show numerical data on a linear scale. In other
cases you may have categorical data, or need to display numerical data on
a datetime or log scale. This section shows how to specify the axis type
when using |bokeh.plotting| interface.

.. _userguide_plotting_categorical_axes:

Categorical Axes
~~~~~~~~~~~~~~~~

Categorical axes are created by specifying a
:class:`~bokeh.models.ranges.FactorRange` for one of the plot ranges (or a
list of factors to be converted to one). Below is a simple example, for
complete details see :ref:`userguide_categorical`.

.. bokeh-plot:: docs/user_guide/examples/plotting_categorical_axis.py
    :source-position: above

.. _userguide_plotting_datetime_axes:

Datetime Axes
~~~~~~~~~~~~~

When dealing with timeseries data, or any data that involves dates or
times, it is desirable to have an axis that can display labels that
are appropriate to different date and time scales.

.. note::
    This example requires a network connection and depends on the
    open source Pandas library in order to more easily present realistic
    timeseries data.

We have seen how to use the |figure| function to create plots using the
|bokeh.plotting| interface. This function accepts  ``x_axis_type`` and
``y_axis_type`` as arguments. To specify a datetime axis, pass ``"datetime"``
for the value of either of these parameters.

.. bokeh-plot:: docs/user_guide/examples/plotting_datetime_axis.py
    :source-position: above

.. note::
    Future versions of Bokeh will attempt to auto-detect situations when
    datetime axes are appropriate, and add them automatically by default.

.. _userguide_plotting_log_axes:

Log Scale Axes
~~~~~~~~~~~~~~

When dealing with data that grows exponentially or is of many orders of magnitude,
it is often necessary to have one axis on a log scale. Another scenario involves
plotting data that has a power law relationship, when it is desirable to use log
scales on both axes.

As we saw above, the |figure| function accepts ``x_axis_type`` and
``y_axis_type`` as arguments. To specify a log axis, pass ``"log"`` for
the value of either of these parameters.

By default, log axis ranges are calculated to fit around positive valued data. To
set your own ranges, see the section on :ref:`userguide_plotting_setting_ranges`.

.. bokeh-plot:: docs/user_guide/examples/plotting_log_scale_axis.py
    :source-position: above

.. _userguide_plotting_twin_axes:

Twin Axes
~~~~~~~~~

It is possible to add multiple axes representing different ranges to a single
plot. To do this, configure the plot with "extra" named ranges in the
``extra_x_range`` and ``extra_y_range`` properties. Then these named ranges
can be referred to when adding new glyph methods, and also to add new axes
objects using the ``add_layout`` method on |Plot|. An example is given
below:

.. bokeh-plot:: docs/user_guide/examples/plotting_twin_axes.py
    :source-position: above

.. _axial coordinates: https://www.redblobgames.com/grids/hexagons/#coordinates-axial

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`
.. |Figure| replace:: :class:`~bokeh.plotting.Figure`
.. |figure| replace:: :func:`~bokeh.plotting.figure`
.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |annular_wedge|     replace:: :func:`~bokeh.plotting.Figure.annular_wedge`
.. |annulus|           replace:: :func:`~bokeh.plotting.Figure.annulus`
.. |arc|               replace:: :func:`~bokeh.plotting.Figure.arc`
.. |asterisk|          replace:: :func:`~bokeh.plotting.Figure.asterisk`
.. |bezier|            replace:: :func:`~bokeh.plotting.Figure.bezier`
.. |circle|            replace:: :func:`~bokeh.plotting.Figure.circle`
.. |circle_cross|      replace:: :func:`~bokeh.plotting.Figure.circle_cross`
.. |circle_dot|        replace:: :func:`~bokeh.plotting.Figure.circle_dot`
.. |circle_x|          replace:: :func:`~bokeh.plotting.Figure.circle_x`
.. |circle_y|          replace:: :func:`~bokeh.plotting.Figure.circle_y`
.. |cross|             replace:: :func:`~bokeh.plotting.Figure.cross`
.. |dash|              replace:: :func:`~bokeh.plotting.Figure.dash`
.. |diamond|           replace:: :func:`~bokeh.plotting.Figure.diamond`
.. |diamond_cross|     replace:: :func:`~bokeh.plotting.Figure.diamond_cross`
.. |diamond_dot|       replace:: :func:`~bokeh.plotting.Figure.diamond_dot`
.. |dot|               replace:: :func:`~bokeh.plotting.Figure.dot`
.. |ellipse|           replace:: :func:`~bokeh.plotting.Figure.ellipse`
.. |harea|             replace:: :func:`~bokeh.plotting.Figure.harea`
.. |harea_stack|       replace:: :func:`~bokeh.plotting.Figure.harea_stack`
.. |hbar|              replace:: :func:`~bokeh.plotting.Figure.hbar`
.. |hbar_stack|        replace:: :func:`~bokeh.plotting.Figure.hbar_stack`
.. |hex|               replace:: :func:`~bokeh.plotting.Figure.hex`
.. |hex_dot|           replace:: :func:`~bokeh.plotting.Figure.hex_dot`
.. |hline_stack|       replace:: :func:`~bokeh.plotting.Figure.hline_stack`
.. |inverted_triangle| replace:: :func:`~bokeh.plotting.Figure.inverted_triangle`
.. |image|             replace:: :func:`~bokeh.plotting.Figure.image`
.. |image_rgba|        replace:: :func:`~bokeh.plotting.Figure.image_rgba`
.. |image_url|         replace:: :func:`~bokeh.plotting.Figure.image_url`
.. |line|              replace:: :func:`~bokeh.plotting.Figure.line`
.. |multi_line|        replace:: :func:`~bokeh.plotting.Figure.multi_line`
.. |multi_polygons|    replace:: :func:`~bokeh.plotting.Figure.multi_polygons`
.. |patch|             replace:: :func:`~bokeh.plotting.Figure.patch`
.. |patches|           replace:: :func:`~bokeh.plotting.Figure.patches`
.. |plus|              replace:: :func:`~bokeh.plotting.Figure.plus`
.. |quad|              replace:: :func:`~bokeh.plotting.Figure.quad`
.. |quadratic|         replace:: :func:`~bokeh.plotting.Figure.quadratic`
.. |ray|               replace:: :func:`~bokeh.plotting.Figure.ray`
.. |rect|              replace:: :func:`~bokeh.plotting.Figure.rect`
.. |segment|           replace:: :func:`~bokeh.plotting.Figure.segment`
.. |step|              replace:: :func:`~bokeh.plotting.Figure.step`
.. |square|            replace:: :func:`~bokeh.plotting.Figure.square`
.. |square_cross|      replace:: :func:`~bokeh.plotting.Figure.square_cross`
.. |square_dot|        replace:: :func:`~bokeh.plotting.Figure.square_dot`
.. |square_pin|        replace:: :func:`~bokeh.plotting.Figure.square_pin`
.. |square_x|          replace:: :func:`~bokeh.plotting.Figure.square_x`
.. |triangle|          replace:: :func:`~bokeh.plotting.Figure.triangle`
.. |triangle_dot|      replace:: :func:`~bokeh.plotting.Figure.triangle_dot`
.. |triangle_pin|      replace:: :func:`~bokeh.plotting.Figure.triangle_pin`
.. |varea|             replace:: :func:`~bokeh.plotting.Figure.varea`
.. |varea_stack|       replace:: :func:`~bokeh.plotting.Figure.varea_stack`
.. |vbar|              replace:: :func:`~bokeh.plotting.Figure.vbar`
.. |vbar_stack|        replace:: :func:`~bokeh.plotting.Figure.vbar_stack`
.. |vline_stack|       replace:: :func:`~bokeh.plotting.Figure.vline_stack`
.. |wedge|             replace:: :func:`~bokeh.plotting.Figure.wedge`
.. |x|                 replace:: :func:`~bokeh.plotting.Figure.x`
.. |y|                 replace:: :func:`~bokeh.plotting.Figure.y`
