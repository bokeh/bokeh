
.. _bokeh_glyph_quickref:

Bokeh Glyph Quick Reference
===========================

This section is intended to give a quick overview of what properties all the various Bokeh
glyphs support. For complete details, consult the full :doc:`../reference`.

.. contents::
    :local:
    :depth: 2

.. _bokeh_annular_wedge:

``annular_wedge``
-----------------
The annular_wedge glyph displays annular wedges centered at the given coordinates with the
corresponding ``start_radius``, ``end_radius``,  ``start_angle`` and ``end_angle``.

.. note:: the ``direction`` field may be used to indicate which direction the drawing should occur between ``start_radius`` and ``end_radius``.

* ``x``, ``y`` - center point coordinates
* ``start_radius``
* ``end_radius``
* ``start_angle``
* ``end_angle``
* ``direction``

  * values: ``'clock'``, ``'anticlock'``
  * default: ``'anticlock'``

* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_annulus:

``annulus``
-----------
The annulus glyph displays annular rings centered at the given coordinates with the
corresponding ``start_radius`` and ``end_radius``.

* ``x``, ``y`` - center point coordinates
* ``start_radius``
* ``end_radius``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_arc:

``arc``
-------
The annulus glyph displays circular line arcs centered at the given coordinates with the
corresponding ``radius``, ``start_angle`` and ``end_angle``.

.. note:: the ``direction`` field may be used to indicate which direction the drawing should occur between ``start_radius`` and ``end_radius``.

* ``x``, ``y`` - center point coordinates
* ``radius``
* ``start_angle``
* ``end_angle``
* ``direction``

  * values: [``'clock'`` or ``'anticlock'``]
  * default: ``'anticlock'``

* :ref:`userguide_objects_line_properties`

.. _bokeh_asterisk:

``asterisk``
------------
The asterisk glyph is a :ref:`marker <userguide_objects_markers>` that displays asterisks at
the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`

.. _bokeh_bezier:

``bezier``
----------
The bezier glyph displays Bezier curves with the given starting, ending, and control points.

* ``x0``, ``y0`` - starting point coordinates
* ``x1``, ``y1`` - ending point coordinates
* ``cx0``, ``cy0`` - first control point coordinates
* ``cx1``, ``cy1`` - second control point coordinates
* :ref:`userguide_objects_line_properties`

.. _bokeh_circle:

``circle``
----------
The circle glyph has two forms, a :ref:`marker <userguide_objects_markers>` form that takes a ``size``
field or a non-marker form that takes a ``radius`` field.

+------------------------------------------+------------------------------------------+
|* ``x``, ``y`` - center point coordinates |* ``x``, ``y`` - center point coordinates |
|* ``size``                                |* ``radius``                              |
|* :ref:`userguide_objects_line_properties`|* :ref:`userguide_objects_line_properties`|
|* :ref:`userguide_objects_fill_properties`|* :ref:`userguide_objects_fill_properties`|
+------------------------------------------+------------------------------------------+

.. _bokeh_circle_cross:

``circle_cross``
----------------
The circle_cross glyph is a :ref:`marker <userguide_objects_markers>` that displays circles
together with a crossbar (+) at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_circle_x:

``circle_x``
------------
The circle_x glyph is a :ref:`marker <userguide_objects_markers>` that displays circles
together with an X at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_cross:

``cross``
---------
The cross glyph is a :ref:`marker <userguide_objects_markers>` that displays crossbar symbols (+)
at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`

.. _bokeh_diamond:

``diamond``
-----------
The diamond glyph is a :ref:`marker <userguide_objects_markers>` that displays diamonds
at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_diamond_cross:

``diamond_cross``
-----------------
The diamond_cross glyph is a :ref:`marker <userguide_objects_markers>` that displays diamonds
together with a crossbar (+) at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_image:

``image``
---------
The image glyph takes each ``image`` as a two-dimensional array of data. A ``palette`` (string
name of a built-in palette, currently) must also be supplied to use for color-mapping the scalar
image.

.. note:: the ``dilate`` field may be used to indicate whether computed pixel distances (e.g. for `dw`, `dh`) should always be rounded up when rendering this glyph.

.. note:: The image glyph is vectorized like other glyphs, i.e. it may be used to display several images at once.

* ``image`` - 2D array of data
* ``x``, ``y`` - lower left
* ``dw`` - width on screen
* ``dh``- height on screen
* ``palette``
* ``dilate``

  * default: `False`

.. _bokeh_image_rgba:

``image_rgba``
--------------
The image_rgba glyph takes each ``image`` as a two-dimensional array of RGBA values (encoded
as 32-bit integers).

.. note:: the ``dilate`` field may be used to indicate whether computed pixel distances (e.g. for `dw`, `dh`) should always be rounded up when rendering this glyph.

.. note:: The image_rgba glyph is vectorized like other glyphs, i.e. it may be used to display several images at once.

* ``image`` - 2D array of RGBA
* ``x``, ``y`` - lower left
* ``dw`` - width on screen
* ``dh``- height on screen
* ``dilate``

  * default: `False`

.. _bokeh_image_url:

``image_url``
-------------
The image_url glyph accepts the URLs of an images to display. The images are centered
on the given coordinates and rotated by the given angles.

* ``x``, ``y`` - center point coordinates
* ``url``
* ``angle``

.. _bokeh_inverted_triangle:

``inverted_triangle``
---------------------
The inverted_triangle glyph is a :ref:`marker <userguide_objects_markers>` that displays
upside-down triangles at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_line:

``line``
--------
The line glyph displays a single line that connects several points given by the arrays
of coordinates ``x`` and ``y``.

* ``x``, ``y`` - line coordinates
* :ref:`userguide_objects_line_properties`

.. _bokeh_multi_line:

``multi_line``
--------------
The multi_line glyph displays several lines, each with points given by the arrays of
coordinates that are the elements of ``xs`` and ``ys``. This glyph is especially useful for
implementing parallel coordinates plots, or plotting several aligned series simultaneously.

.. note:: For this glyph, the vector data is not simply an array of scalars, it is really an "array of arrays".

* ``xs``, ``ys`` - lists of line coordinates
* :ref:`userguide_objects_line_properties`

.. _bokeh_oval:

``oval``
--------
The oval glyph displays ovals centered on the given coordinates with the given dimensions
and angle.

* ``x``, ``y`` - center point coordinates
* ``width``
* ``height``
* ``angle``

  * default: 0

* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_patch:

``patch``
---------
The patch glyph displays a single polygonal patch that connects several points given by the arrays
of coordinates ``x`` and ``y``.

* ``x``, ``y`` - coordinates
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_patches:

``patches``
-----------
The patches glyph displays several patches, each with points given by the arrays of
coordinates that are the elements of ``xs`` and ``ys``. This glyph is especially useful for
implementing stacked area charts and cartograms.

.. note:: For this glyph, the vector data is not simply an array of scalars, it is really an "array of arrays".

* ``xs``, ``ys`` - lists of coordinates
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_quad:

``quad``
--------
The quad glyph displays axis-aligned rectangles with the given dimensions.

* ``left``
* ``right``
* ``top``
* ``bottom``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_quadratic:

``quadratic``
-------------
The quadratic glyph displays quadratic curves with the given starting, ending, and control points.

* ``x0``, ``y0`` - starting point coordinates
* ``x1``, ``y1`` - ending point coordinates
* ``cx``, ``cy`` - control point coordinates
* :ref:`userguide_objects_line_properties`

.. _bokeh_ray:

``ray``
-------
The ray glyph displays line segments starting at the given coordinate and extending the given
``length`` at the given ``angle``.

* ``x0``, ``y0`` - starting point coordinates
* ``length`` - screen units
* ``angle``

  * default: 0

* :ref:`userguide_objects_line_properties`

.. _bokeh_rect:

``rect``
--------
The rect glyph displays rectangles centered on the given coordinates with the given dimensions
and angle.

.. note:: the ``dilate`` field may be used to indicate whether computed pixel distances should always be rounded up when rendering this glyph.

* ``x``, ``y`` - center point coordinates
* ``width``
* ``height``
* ``angle``

  * default: 0

* ``dilate``

  * default: `False`

* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`


.. _bokeh_segment:

``segment``
-----------
The segment glyph displays line segments with the given starting and ending coordinates.


* ``x0``, ``y0`` - starting point coordinates
* ``x1``, ``y1`` - ending point coordinates
* :ref:`userguide_objects_line_properties`

.. _bokeh_square:

``square``
----------
The square glyph is a :ref:`marker <userguide_objects_markers>` that displays squares
at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_square_cross:

``square_cross``
----------------
The square_cross glyph is a :ref:`marker <userguide_objects_markers>` that displays squares
together with a crossbar (+) at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_square_x:

``square_x``
------------
The square_x glyph is a :ref:`marker <userguide_objects_markers>` that displays squares
together with an X at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_text:

``text``
--------
The text glyph displays text at the given coordinates rotated by the given angle. The
location of the coordinates relative to the text is indicated by the text properties.

* ``x``, ``y`` - text coordinates (positioning determined by text properties)
* ``text``
* ``angle``

  * default: 0

* :ref:`userguide_objects_text_properties`

.. _bokeh_triangle:

``triangle``
------------
The triangle glyph is a :ref:`marker <userguide_objects_markers>` that displays triangles
at the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_wedge:

``wedge``
---------
The annular_wedge glyph displays circular wedges centered at the given coordinates with the
corresponding ``radius``,  ``start_angle`` and ``end_angle``.

.. note:: the ``direction`` field may be used to indicate which direction the drawing should occur between ``start_radius`` and ``end_radius``.

* ``x``, ``y`` - center point coordinates
* ``radius``
* ``start_angle``
* ``end_angle``
* ``direction``

  * values: [``'clock'`` or ``'anticlock'``]
  * default: ``'anticlock'``

* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`

.. _bokeh_x:

``x``
-----
The x glyph is a :ref:`marker <userguide_objects_markers>` that displays X symbols at
the given coordinates.

* ``x``, ``y`` - center point coordinates
* ``size``
* :ref:`userguide_objects_line_properties`
* :ref:`userguide_objects_fill_properties`


