.. _ug_basic_areas:

Area glyphs
===========

.. TODO: some comments

.. _ug_basic_areas_rects:

Rectangles
----------

Bars
~~~~

To create a basic bar chart, use the |hbar| (horizontal bars) or |vbar|
(vertical bars) glyph methods. Please visit the detailed documentation page
:ref:`ug_basic_bars`, because this type is so common.

.. bokeh-plot:: __REPO__/examples/basic/bars/vbar.py
    :source-position: above

Quads
~~~~~

To draw *axis aligned* rectangles by specifying the ``left``, ``right``,
``top``, and ``bottom`` positions, use the |quad| glyph function:

.. bokeh-plot:: __REPO__/examples/basic/areas/quad.py
    :source-position: above

Blocks
~~~~~~

To draw *axis aligned* rectangles by specifying the ``x`` and ``y``
coordinates for the origin, and a ``width`` and ``height``, use the |block|
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

Polygons
--------

The |polygons| glyph accepts geometry in the same nested representation used
by GeoJSON. A Polygon contains an exterior ring followed by any interior
rings. A MultiPolygon contains one or more Polygons. Bokeh keeps each top-level
feature as one selectable item, including all of its holes and disjoint parts.

You can pass geometry mappings or records directly. Records with a ``geometry``
value can include additional attributes for colors, alpha values, hover
tooltips, and callbacks. For geometry reused by multiple renderers, construct a
:class:`~bokeh.models.sources.GeometryDataSource` explicitly.

Simple polygon
~~~~~~~~~~~~~~

The following example renders a single Polygon feature:

.. bokeh-plot:: __REPO__/examples/basic/areas/patch_single.py
    :source-position: above

Multiple polygons
~~~~~~~~~~~~~~~~~

Each record in the following example is independently selectable and carries
its own vectorized style attributes:

.. bokeh-plot:: __REPO__/examples/basic/areas/patch_multiple.py
    :source-position: above

Disjoint parts
~~~~~~~~~~~~~~

Use a MultiPolygon when one logical feature has disjoint parts. This avoids
sentinel ``NaN`` coordinates and keeps hit testing and selection attached to
the complete feature:

.. bokeh-plot:: __REPO__/examples/basic/areas/patch_missing_points.py
    :source-position: above

The equivalent simple Polygon representation is shown separately here:

.. bokeh-plot:: __REPO__/examples/basic/areas/multipolygon_simple.py
    :source-position: above

Polygon with holes
~~~~~~~~~~~~~~~~~~

The following example generates a Polygon with two holes. The first ring is
the exterior and the following rings are holes:

.. bokeh-plot:: __REPO__/examples/basic/areas/multipolygon_with_holes.py
    :source-position: above

Multi-polygon with separate parts
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A single feature can comprise multiple polygon geometries. Each Polygon in the
MultiPolygon below represents one part of the same selectable feature:

.. bokeh-plot:: __REPO__/examples/basic/areas/multipolygon_with_separate_parts.py
    :source-position: above

Multiple multi-polygons
~~~~~~~~~~~~~~~~~~~~~~~

The top-level sequence separates features. Each record can contain either a
Polygon or MultiPolygon and corresponding attributes such as a color:

.. bokeh-plot:: __REPO__/examples/basic/areas/multipolygons.py
    :source-position: above

.. note::
    The legacy |patch| and |patches| methods remain available for 4.x document
    compatibility but are deprecated. Use |polygons| for new code.

Strips
~~~~~~

To draw multiple horizontal or vertical strips (bars of infinite width or
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
.. |hbar|              replace:: :func:`~bokeh.plotting.figure.hbar`
.. |hstrip|            replace:: :func:`~bokeh.plotting.figure.hstrip`
.. |line|              replace:: :func:`~bokeh.plotting.figure.line`
.. |multi_line|        replace:: :func:`~bokeh.plotting.figure.multi_line`
.. |multi_polygons|    replace:: :func:`~bokeh.plotting.figure.multi_polygons`
.. |patch|             replace:: :func:`~bokeh.plotting.figure.patch`
.. |patches|           replace:: :func:`~bokeh.plotting.figure.patches`
.. |polygons|          replace:: :func:`~bokeh.plotting.figure.polygons`
.. |quad|              replace:: :func:`~bokeh.plotting.figure.quad`
.. |rect|              replace:: :func:`~bokeh.plotting.figure.rect`
.. |varea|             replace:: :func:`~bokeh.plotting.figure.varea`
.. |varea_stack|       replace:: :func:`~bokeh.plotting.figure.varea_stack`
.. |vbar|              replace:: :func:`~bokeh.plotting.figure.vbar`
.. |vstrip|            replace:: :func:`~bokeh.plotting.figure.vstrip`
