.. _userguide_plotting:

Plotting with Basic Glyphs
==========================

.. contents::
    :local:
    :depth: 3

.. _userguide_plotting_figures:

Creating Figures
----------------

Note that Bokeh plots created using the |bokeh.plotting| interface come with
a default set of tools, and default visual styles. See :ref:`userguide_styling`
for information about how to customize the visual style of plots, and
:ref:`userguide_tools` for information about changing or specifying tools.

.. _userguide_plotting_scatter_markers:

Scatter Markers
~~~~~~~~~~~~~~~

To scatter circle markers on a plot, use the |circle| method of |Figure|:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_scatter_circle.py
    :source-position: above

Similarly, to scatter square markers, use the |square| method of |Figure|:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_scatter_square.py
    :source-position: above

There are lots of marker types available in Bokeh, you can see details and
example plots for all of them by clicking on entries in the list below:

.. hlist::
    :columns: 3

    * |asterisk|
    * |circle|
    * |circle_cross|
    * |circle_x|
    * |cross|
    * |diamond|
    * |diamond_cross|
    * |inverted_triangle|
    * |square|
    * |square_cross|
    * |square_x|
    * |triangle|
    * |x|

All the markers have the same set of properties: ``x``, ``y``, ``size`` (in
screen units), and ``angle`` (radians by default). Additionally, |circle| has
a ``radius`` property that can be used to specify data-space units.

.. _userguide_plotting_line_glyphs:

Line Glyphs
~~~~~~~~~~~

Single Lines
''''''''''''

Below is an example that shows how to generate a single line glyph from
one dimensional sequences of *x* and *y* points using the |line| glyph
method:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_line_single.py
    :source-position: above

Multiple Lines
''''''''''''''

Sometimes it is useful to plot multiple lines all at once. This can be
accomplished with the |multi_line| glyph method:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_line_multiple.py
    :source-position: above

.. note::
    This glyph is unlike most other glyphs. Instead of accepting a one
    dimensional list or array of scalar values, it accepts a "list of lists".

Missing Points
''''''''''''''

``NaN`` values can be passed to |line| and |multi_line| glyphs. In this case,
you end up with single logical line objects, that have multiple disjoint
components when rendered:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_line_missing_points.py
    :source-position: above

.. _userguide_plotting_patch_glyphs:

Patch Glyphs
~~~~~~~~~~~~

Single Patches
''''''''''''''

Below is an example that shows how to generate a single polygonal patch
glyph from one dimensional sequences of *x* and *y* points using the
|patch| glyph method:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_patch_single.py
    :source-position: above

Multiple Patches
''''''''''''''''

Sometimes it is useful to plot multiple lines all at once. This can be
accomplished with the |patches| glyph method:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_patch_multiple.py
    :source-position: above

.. note::
    This glyph is unlike most other glyphs. Instead of accepting a one
    dimensional list or array of scalar values, it accepts a "list of lists".

Missing Points
''''''''''''''

Just as with |line| and |multi_line|, ``NaN`` values can be passed to
|patch| and |patches| glyphs. In this case, you end up with single logical
patch objects, that have multiple disjoint components when rendered:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_patch_missing_points.py
    :source-position: above

.. warning::
    Hit testing on patch objects with ``NaN`` values is not currently
    supported.

.. _userguide_plotting_quads_rects:

Rectangles and Ovals
~~~~~~~~~~~~~~~~~~~~

To draw *axis aligned* rectangles ("quads"), use the |quad| glyph function,
which accepts ``left``, ``right``, ``top``, and ``bottom`` values to specify
positions:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_rectangles.py
    :source-position: above

To draw arbitrary rectangles by specifying a center point, a width, height,
and angle, use the |rect| glyph function:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_rectangles_rotated.py
    :source-position: above

The |oval| glyph method accepts the same properties as |rect|, but renders
oval shapes:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_ovals.py
    :source-position: above

.. _userguide_plotting_images:

Images
~~~~~~

You can dipslay images on Bokeh plots using the |image|, |image_rgba|, and
|image_url| glyph methods.

The first example here shows how to display images in Bokeh plots from
raw RGBA data using |image_rgba|:

.. note::
    This example depends on the open source NumPy library in order to more
    easily generate an array of RGBA data.

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_image.py
    :source-position: above

.. _userguide_plotting_segments_rays:

Segments and Rays
~~~~~~~~~~~~~~~~~

Sometimes it is useful to be able to draw many individual line segments at
once. Bokeh provides the |segment| and |ray| glyph methods to render these.

The |segment| function accepts start points ``x0``, ``y0`` and end points
``x1`` and ``y1`` and renders segments between these:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_segments.py
    :source-position: above

The |ray| function accepts start points ``x``, ``y`` with a ``length``
(in screen units) and an ``angle``. The default ``angle_units`` are ``"rad"``
but can also be changed to ``"deg"``. To have an "infinite" ray, that always
extends to the edge of the plot, specify ``0`` for the length:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_ray.py
    :source-position: above

.. _userguide_plotting_wedges_arcs:

Wedges and Arcs
~~~~~~~~~~~~~~~

To draw a simple line arc, Bokeh provides the |arc| glyph method, which
accepts ``radius``, ``start_angle``, and ``end_angle`` to determine position.
Additionally, the ``direction`` property determines whether to render
clockwise (``"clocl"``) or anti-clockwise (``"anticlock"``) between the start
and end angles.

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_arcs.py
    :source-position: above

The |wedge| glyph method accepts the same properties as |arc|, but renders a
filled wedge instead:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_wedge.py
    :source-position: above

The |annular_wedge| glyph method is similar to |arc|, but draws a filled area.
It accepts a ``inner_radius`` and ``outer_radius`` instead of just ``radius``:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_annular_wedge.py
    :source-position: above

Finally, the |annulus| glyph methods, which accepts ``inner_radius`` and
``outer_radius``, can be used to draw filled rings:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_annulus.py
    :source-position: above

.. _userguide_plotting_quadratic_cubic_curves:

Specialized Curves
~~~~~~~~~~~~~~~~~~

Bokeh also provides |quadratic| and |bezier| glyph methods for drawing
parameterized quardratic and cubic curves. These are somewhat uncommon,
please refer to the reference documentation linked above for details.

.. _userguide_plotting_multiple_glyphs:

Combining Multiple Glyphs
-------------------------

Combining multiple glyphs on a single plot is a matter of calling more than
one glyph method on a single |Figure|:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_multiple_glyphs.py
    :source-position: above

This principle holds in general for all the glyph methods in
|bokeh.plotting|. Any number of glyphs may be added to a Bokeh
plot.

.. _userguide_plotting_setting_ranges:

Setting Ranges
--------------

By default, Bokeh will attempt to automatically set the data bounds
of plots to fit snugly around the data. Sometimes you may need to
set a plot's range explicitly. This can be accomplished by setting the
``x_range`` or ``y_range`` properties using a ``Range1d`` object that
gives the *start* and *end* points of the range you want:

.. code-block:: python

    p.x_range = Range1d(0, 100)

As a convenience, the |figure| function can also accept tuples of
*(start, end)* as values for the ``x_range`` or ``y_range`` parameters.
Below is a an example that shows both methods of setting the range:

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_figure_range.py
    :source-position: above

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

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_categorical_axis.py
    :source-position: above

.. _userguide_plotting_datetime_axes:

Datetime Axes
~~~~~~~~~~~~~

When dealing with timeseries data, or any data that involves dates or
times, it is desirable to have an axis that can display labels that
are appropriate to different date and time scales.

.. note::
    This example requires a network connection, and depends on the
    open source Pandas library in order to more easily present realistic
    timeseries data.

We have seen how to use the |figure| function to create plots using the
|bokeh.plotting| interface. This function accepts  ``x_axis_type`` and
``y_axis_type`` as arguments. To specify a datetime axis, pass ``"datetime"``
for the value of either of these parameters.

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_datetime_axis.py
    :source-position: above

.. note::
    Future versions of Bokeh will attempt to auto-detect situations when
    datetime axes are appropriate, and add them automatically by default.

.. _userguide_plotting_log_axes:

Log Scale Axes
~~~~~~~~~~~~~~

When dealing with data that grows quicks (e.g., exponentially), it is often
desired to plot one axis on a log scale. Another use-scenario involves
fitting data to a power law, in which case is it desired to plot with both
axes on a log scale.

As we saw above, the |figure| function accepts ``x_axis_type`` and
``y_axis_type`` as arguments. To specify a log axis, pass ``"log"`` for
the value of either of these parameters.

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_log_scale_axis.py
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

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_twin_axes.py
    :source-position: above

.. _userguide_plotting_annotations:

Adding Annotations
------------------

Bokeh includes annotations to allow users to add supplemental information to
their visualizations. This includes legends to identify the distinct variables
and box annotations to highlight specific plot regions.

.. _userguide_plotting_legends:

Legends
~~~~~~~

It is possible to create legends easily by specifying a legend argument to the
glyph methods, when creating a plot.

.. note::
    This example depends on the open source NumPy library in order to more
    easily generate better data suitable for demonstrating legends.

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_legends.py
    :source-position: above

.. _userguide_plotting_box_annotations:

Box Annotations
~~~~~~~~~~~~~~~

Box annotations can be linked to either data or screen coordinates in order to
emphasize desired plot regions. By default, box annotation dimensions (e.g.
left or top) default will extend the annotation to the edge of the plot area.

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_box_annotation.py
    :source-position: above

.. _userguide_plotting_spans:

Spans
~~~~~

Spans (line-type annotations) have a single dimension (width or height) and
extend to the edge of the plot area.

.. bokeh-plot:: source/docs/user_guide/source_examples/plotting_span.py
    :source-position: above

.. |bokeh.plotting| replace:: :ref:`bokeh.plotting <bokeh.plotting>`

.. |Plot| replace:: :class:`~bokeh.models.plots.Plot`

.. |Figure| replace:: :class:`~bokeh.plotting.Figure`

.. |figure| replace:: :func:`~bokeh.plotting.figure`

.. |annular_wedge|     replace:: :func:`~bokeh.plotting.Figure.annular_wedge`
.. |annulus|           replace:: :func:`~bokeh.plotting.Figure.annulus`
.. |arc|               replace:: :func:`~bokeh.plotting.Figure.arc`
.. |asterisk|          replace:: :func:`~bokeh.plotting.Figure.asterisk`
.. |bezier|            replace:: :func:`~bokeh.plotting.Figure.bezier`
.. |circle|            replace:: :func:`~bokeh.plotting.Figure.circle`
.. |circle_cross|      replace:: :func:`~bokeh.plotting.Figure.circle_cross`
.. |circle_x|          replace:: :func:`~bokeh.plotting.Figure.circle_x`
.. |cross|             replace:: :func:`~bokeh.plotting.Figure.cross`
.. |diamond|           replace:: :func:`~bokeh.plotting.Figure.diamond`
.. |diamond_cross|     replace:: :func:`~bokeh.plotting.Figure.diamond_cross`
.. |inverted_triangle| replace:: :func:`~bokeh.plotting.Figure.inverted_triangle`
.. |image|             replace:: :func:`~bokeh.plotting.Figure.image`
.. |image_rgba|        replace:: :func:`~bokeh.plotting.Figure.image_rgba`
.. |image_url|         replace:: :func:`~bokeh.plotting.Figure.image_url`
.. |line|              replace:: :func:`~bokeh.plotting.Figure.line`
.. |multi_line|        replace:: :func:`~bokeh.plotting.Figure.multi_line`
.. |oval|              replace:: :func:`~bokeh.plotting.Figure.oval`
.. |patch|             replace:: :func:`~bokeh.plotting.Figure.patch`
.. |patches|           replace:: :func:`~bokeh.plotting.Figure.patches`
.. |quad|              replace:: :func:`~bokeh.plotting.Figure.quad`
.. |quadratic|         replace:: :func:`~bokeh.plotting.Figure.quadratic`
.. |ray|               replace:: :func:`~bokeh.plotting.Figure.ray`
.. |rect|              replace:: :func:`~bokeh.plotting.Figure.rect`
.. |segment|           replace:: :func:`~bokeh.plotting.Figure.segment`
.. |square|            replace:: :func:`~bokeh.plotting.Figure.square`
.. |square_cross|      replace:: :func:`~bokeh.plotting.Figure.square_cross`
.. |square_x|          replace:: :func:`~bokeh.plotting.Figure.square_x`
.. |triangle|          replace:: :func:`~bokeh.plotting.Figure.triangle`
.. |wedge|             replace:: :func:`~bokeh.plotting.Figure.wedge`
.. |x|                 replace:: :func:`~bokeh.plotting.Figure.x`
