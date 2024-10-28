.. _ug_basic_lines:

Lines and curves
================

.. _ug_basic_lines_single:

Single lines
------------

The example below shows how to generate a single line glyph from
one-dimensional sequences of ``x`` and ``y`` points using the |line| glyph
method:

.. bokeh-plot:: __REPO__/examples/basic/lines/line_single.py
    :source-position: above

.. _ug_basic_lines_step:

Step lines
----------

For some kinds of data, discrete steps between data points may work better than
linear segments. To produce this type of data representation, use the |step|
glyph method.

.. bokeh-plot:: __REPO__/examples/basic/lines/line_steps.py
    :source-position: above

Adjust the ``mode`` parameter to draw step levels with the x-coordinates
before, after, or in the middle of each step.

.. _ug_basic_lines_multi:

Multiple lines
--------------

If you want to draw multiple lines in one go, use the |multi_line| glyph
method as follows:

.. bokeh-plot:: __REPO__/examples/basic/lines/line_multiple.py
    :source-position: above

.. note::
    Unlike many other glyph methods, |multi_line| accepts a list of lists of
    ``x`` and ``y`` positions for each line. The |multi_line| method also
    expects a scalar value or a list of scalars for each line for parameters
    such as color, alpha, and line width. You can similarly use a
    ``ColumnDataSource`` consisting of a list of lists of point coordinates
    and a list of scalar values of matching length.

.. _ug_basic_lines_missing_points:

Missing points
--------------

You can pass ``NaN`` values to |line| and |multi_line| glyphs. This produces
disjointed lines with gaps for ``NaN`` values.

.. bokeh-plot:: __REPO__/examples/basic/lines/line_missing_points.py
    :source-position: above

.. _ug_basic_lines_stacked:

Be aware of the usage of ``NaN`` as a number, which can be imported from
``math`` or ``numpy``. Do not use the native Python ``None`` object,
because this will be evaluated as 0 in the created figure and therefore
drawn. ``None`` will not lead to gaps in the line and can have implicit
effects on the figure, e.g. the ranges of the figure.

Stacked lines
-------------

You may wish to stack lines with a common index when working with time series
of percentages and other similar data. To do so, you can use the |vline_stack|
and |hline_stack| convenience methods.

.. bokeh-plot:: __REPO__/examples/basic/lines/vline_stack.py
    :source-position: above

.. note::
    This and other examples in this chapter rely on ``ColumnDataSource`` for
    data structuring. For information on how to work with this data structure,
    see :ref:`ug_basic_data`.

.. _ug_basic_lines_with_markers:

Combining with markers
----------------------

You can combine multiple glyphs on a single plot by calling their methods on a
single |figure|.

.. bokeh-plot:: __REPO__/examples/basic/lines/multiple_glyphs.py
    :source-position: above

This principle applies to all |bokeh.plotting| glyph methods. You can add as
many glyphs to a Bokeh plot as you want.

Specialized glyphs
------------------

.. _ug_basic_lines_segments:

Segments
~~~~~~~~

To draw multiple individual line segments use the |segment| and |ray| glyph
methods.

The |segment| method accepts the starting points ``x0`` and ``y0`` and end
points ``x1`` and ``y1``. It renders segments between those points.

.. bokeh-plot:: __REPO__/examples/basic/lines/segment.py
    :source-position: above

.. _ug_basic_lines_rays:

Rays
~~~~

The |ray| method accepts the starting points ``x`` and ``y`` with a ``length``
(in |screen units|) and an ``angle``. The ``angle_units`` parameter defaults to
``"rad"`` but you can also set it to ``"deg"`` to have the angle measured in
degrees instead of radians. To have an "infinite" ray that always extends to the
edge of the plot, set ``length`` to ``0``.

.. bokeh-plot:: __REPO__/examples/basic/lines/ray.py
    :source-position: above

.. _ug_basic_lines_spans:

Spans
~~~~~

To draw multiple horizontal or vertical spans (lines of infinite width or
height respectively), use the |hspan| or |vspan| glyph methods. These methods
accept either ``y`` or ``x`` coordinate components respectively. Note that
these glyphs can only compute bounds in one axis, thus may require explicit
range specification in the orthogonal axis, e.g. if used alone.

.. bokeh-plot:: __REPO__/examples/basic/lines/spans.py
    :source-position: above

.. _ug_basic_lines_arcs:

Arcs
~~~~

To draw a simple line arc, use the |arc| glyph method, which accepts
``radius``, ``start_angle``, and ``end_angle`` to determine position.
Additionally, the ``direction`` property determines whether to render
clockwise (``"clock"``) or anti-clockwise (``"anticlock"``) between the start
and end angles.

.. bokeh-plot:: __REPO__/examples/basic/lines/arcs.py
    :source-position: above

.. _ug_basic_lines_parameterized:

Parameterized
~~~~~~~~~~~~~

To draw parameterized quadratic and cubic curves, use the |quadratic| and
|bezier| glyph methods. For more detail on these curves, see
:ref:`reference documentation <bokeh.plotting>`.

.. |arc|               replace:: :func:`~bokeh.plotting.figure.arc`
.. |bezier|            replace:: :func:`~bokeh.plotting.figure.bezier`
.. |hline_stack|       replace:: :func:`~bokeh.plotting.figure.hline_stack`
.. |hspan|             replace:: :func:`~bokeh.plotting.figure.hspan`
.. |line|              replace:: :func:`~bokeh.plotting.figure.line`
.. |multi_line|        replace:: :func:`~bokeh.plotting.figure.multi_line`
.. |step|              replace:: :func:`~bokeh.plotting.figure.step`
.. |vline_stack|       replace:: :func:`~bokeh.plotting.figure.vline_stack`
.. |quadratic|         replace:: :func:`~bokeh.plotting.figure.quadratic`
.. |ray|               replace:: :func:`~bokeh.plotting.figure.ray`
.. |segment|           replace:: :func:`~bokeh.plotting.figure.segment`
.. |vspan|             replace:: :func:`~bokeh.plotting.figure.vspan`
