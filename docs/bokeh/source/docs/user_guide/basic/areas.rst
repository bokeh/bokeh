.. _ug_basic_areas:

Area glyphs
===========

.. TODO: some comments

.. _ug_basic_areas_rects:

Rectangles
----------

Bars
~~~~

.. TODO: refs to bars

Quads
~~~~~

To draw *axis aligned* rectangles by specifying the ``left``, ``right``,
``top``, and ``bottom`` positions, use the |quad| glyph function:

.. bokeh-plot:: __REPO__/examples/basic/areas/quad.py
    :source-position: above

Blocks
~~~~~~

To draw *axis aligned* rectangles by specifying the ``x`` and ``y``
coordinates for a lower-left corner, and a ``width`` and ``height``, use the |block|
glyph function:

.. bokeh-plot:: __REPO__/examples/basic/areas/block.py
    :source-position: above

Rotatable
~~~~~~~~~

To draw arbitrary rectangles by specifying center coordinates, ``width``,
``height``, and ``angle``, use the |rect| glyph function:

.. bokeh-plot:: __REPO__/examples/basic/areas/rect.py
    :source-position: above

.. _ug_basic_areas_directed:

Directed areas
--------------

Directed areas are filled regions between two series that share a common index.
For instance, a vertical directed area has one ``x`` coordinate array and two
``y`` coordinate arrays, ``y1`` and ``y2``, defining the space for Bokeh to
fill.

Single areas
~~~~~~~~~~~~

To fill an area in vertical direction, use the |varea| method. You can do the
same in horizontal direction with |harea|.

.. bokeh-plot:: __REPO__/examples/basic/areas/varea.py
    :source-position: above

Stacked areas
~~~~~~~~~~~~~

To stack directed areas, use the |varea_stack| and |harea_stack| convenience
methods.

.. bokeh-plot:: __REPO__/examples/basic/areas/varea_stack.py
    :source-position: above

.. _ug_basic_areas_patches:

Patches
-------

Single patches
~~~~~~~~~~~~~~

The following example generates a single polygonal patch from one-dimensional
sequences of ``x`` and ``y`` points using the |patch| glyph method:

.. bokeh-plot:: __REPO__/examples/basic/areas/patch_single.py
    :source-position: above

Multiple patches
~~~~~~~~~~~~~~~~

To plot several polygonal patches, use the |patches| glyph method:

.. bokeh-plot:: __REPO__/examples/basic/areas/patch_multiple.py
    :source-position: above

.. note::
    Unlike many other glyph methods, |patches| accepts a list of lists of ``x``
    and ``y`` positions for each line. The |patches| method also expects a
    scalar value or a list of scalars for each patch for parameters such as
    color, alpha, and line width. You can similarly use a ``ColumnDataSource``
    consisting of a list of lists of point coordinates and a list of scalar
    values of matching length.

Missing points
~~~~~~~~~~~~~~

Just as with the |line| and |multi_line| methods, you can pass ``NaN`` values
to |patch| and |patches| glyphs. This produces disjointed patches with gaps
for ``NaN`` values.

.. bokeh-plot:: __REPO__/examples/basic/areas/patch_missing_points.py
    :source-position: above

.. warning::
    Bokeh doesn't currently support hit testing on patch objects with ``NaN``
    values.

Polygons
--------

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
~~~~~~~~~~~~~~

The following example generates a single polygon from a triple-nested list of
one-dimensional sequences of ``x`` and ``y`` points using the |multi_polygons|
glyph method.

.. bokeh-plot:: __REPO__/examples/basic/areas/multipolygon_simple.py
    :source-position: above

Polygon with holes
~~~~~~~~~~~~~~~~~~

The following example generates a single polygon with holes from three
sequences of ``x`` and ``y`` points. The first sequence represents
the exterior of the polygon and the following sequences represent the holes.

.. bokeh-plot:: __REPO__/examples/basic/areas/multipolygon_with_holes.py
    :source-position: above

Multi-polygon with separate parts
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A single polygon concept can comprise multiple polygon geometries. The
following example generates a multi-polygon glyph from several sequences of
``x`` and ``y`` points. Each item in the sequence represents a part of the
glyph.

.. bokeh-plot:: __REPO__/examples/basic/areas/multipolygon_with_separate_parts.py
    :source-position: above

Multiple multi-polygons
~~~~~~~~~~~~~~~~~~~~~~~

The top-level of nesting separates each multi-polygon from the rest. You can
think of each multi-polygon as a row in the data source, potentially with a
corresponding label or color.

.. bokeh-plot:: __REPO__/examples/basic/areas/multipolygons.py
    :source-position: above

Strips
~~~~~~

To draw multiple horizontal or vertical strips (bars of inifinite width or
height respectively), use the |hstrip| or |vstrip| glyph methods. These methods
accept either ``y0`` and ``y1`` or ``x0`` and ``x1`` coordinate components
respectively. Note that these glyphs can only compute bounds in one axis, thus
may require explicit range specification in the orthogonal axis, e.g. if used
alone.

.. bokeh-plot:: __REPO__/examples/basic/areas/strips.py
    :source-position: above

Ellipses
--------

The |ellipse| glyph method accepts the same properties as |rect|, but renders
ellipse shapes.

.. bokeh-plot:: __REPO__/examples/basic/areas/ellipses.py
    :source-position: above

.. |block|             replace:: :func:`~bokeh.plotting.figure.block`
.. |ellipse|           replace:: :func:`~bokeh.plotting.figure.ellipse`
.. |harea|             replace:: :func:`~bokeh.plotting.figure.harea`
.. |harea_stack|       replace:: :func:`~bokeh.plotting.figure.harea_stack`
.. |hstrip|            replace:: :func:`~bokeh.plotting.figure.hstrip`
.. |line|              replace:: :func:`~bokeh.plotting.figure.line`
.. |multi_line|        replace:: :func:`~bokeh.plotting.figure.multi_line`
.. |multi_polygons|    replace:: :func:`~bokeh.plotting.figure.multi_polygons`
.. |patch|             replace:: :func:`~bokeh.plotting.figure.patch`
.. |patches|           replace:: :func:`~bokeh.plotting.figure.patches`
.. |quad|              replace:: :func:`~bokeh.plotting.figure.quad`
.. |rect|              replace:: :func:`~bokeh.plotting.figure.rect`
.. |varea|             replace:: :func:`~bokeh.plotting.figure.varea`
.. |varea_stack|       replace:: :func:`~bokeh.plotting.figure.varea_stack`
.. |vstrip|            replace:: :func:`~bokeh.plotting.figure.vstrip`
