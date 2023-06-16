.. _ug_topics_contour:

Contour plots
=============

Contour plots are used to calculate and render lines of constant value in
two-dimensional quadrilateral grids. Both the lines and the filled regions
between lines can be rendered with a single function call.

.. _ug_topics_contour_simple:

Simple example
--------------

Here is a simple example rendering both contour lines and filled polygon
regions.

.. bokeh-plot:: __REPO__/examples/topics/contour/contour_simple.py
    :source-position: above

By convention, ``z`` is the 2D array to contour and is defined on an ``x``,
``y`` grid. Here the grid is a regularly-spaced Cartesian grid.  ``levels``
contains the sequence of levels to contour.

Both ``line_color`` and ``fill_color`` are optional keyword arguments to
:func:`~bokeh.plotting.figure.contour`. ``line_color`` must be specified to
draw contour lines and ``fill_color`` to draw filled contour polygons. They
can be scalar or vector visual properties.

.. note::

   The length of vector visual properties for contour lines is ``len(levels)``
   and for filled contour polygons it is ``len(levels)-1``.

In this example ``line_color`` is a scalar so every contour line is rendered
as a solid black line. The ``fill_color`` is a vector so that the filled
regions between contour levels are rendered with different colors.

There is a colorbar on the right of the plot which is obtained using
:meth:`~bokeh.models.ContourRenderer.construct_color_bar`. It automatically
displays the same fill and line visual properties as the contour plot.

.. _ug_topics_contour_polar:

Polar grid example
------------------

Here is a more complicated example showing other features available for
contour plots.

.. bokeh-plot:: __REPO__/examples/topics/contour/contour_polar.py
    :source-position: above

The grid is polar, wrapping around on itself, and there are many more visual
properties including ``line``, ``fill`` and ``hatch`` properties. Many of
these are vector properties so that it is possible to emphasize, for example,
positive and negative contour levels differently.

All visual properties can be scalar or vector of the correct length. Color
visual properties ``line_color``, ``fill_color`` and ``hatch_color`` support a
few extra options for how they can be specified:

* A sequence of colors that is longer or shorter than required will be
  resampled using :func:`~bokeh.palettes.interp_palette`. The length 256
  palettes such as ``Cividis256`` are useful here.

* A palette collection such as ``Cividis`` may be used, which is a dictionary
  that maps from palette length (number of colors) to palette. If the
  collection contains a palette of the correct length then that is used.
  If the required length is outside of those available in the collection then
  the palette with the nearest length is used, linearly interpolated.

:func:`~bokeh.models.ContourRenderer.construct_color_bar` accepts other
keyword arguments that are passed to the
:class:`~bokeh.models.ContourColorBar` constructor to set properties such as
the ``title`` shown here.

.. _ug_topics_contour_animated:

Animated contours
-----------------

Bokeh can generate animated contour plots using ``bokeh serve`` as the contour
calculations occur in Python. Here is an example taken from
``examples/app/contour_animated.py``:

.. bokeh-plot:: __REPO__/examples/server/app/contour_animated.py
    :source-position: above

To run this on a Bokeh server use

.. code-block:: sh

    bokeh serve --show contour_animated.py

The key sequence of actions to perform the animation are:

#. Call :func:`~bokeh.plotting.figure.contour` as usual, and store the
   returned :class:`~bokeh.models.ContourRenderer`.

#. Determine the updated ``z`` array, which might be read from file or
   calculated, for example.

#. Pass the updated ``z`` and unchanged ``x``, ``y`` and ``levels`` to
   :func:`~bokeh.plotting.contour.contour_data` to generate a contour data
   object.

#. Call :meth:`~bokeh.models.ContourRenderer.set_data` with the new contour
   data object.

#. Repeat from stage 2.

The animation example here assumes the grid, contour levels and visual
properties are not changed. It is possible to do so, but care is needed to
correctly deal with changing plot bounds and assignment of visual properties
to contour levels, so it is usually easier to remove the old unwanted contour
plot and replace it with a new one in these circumstances.

Advanced details
----------------

The only compulsory keyword arguments to :func:`~bokeh.plotting.figure.contour`
are ``z``, ``levels`` and at least one of ``fill_color`` and ``line_color``.
``x`` and ``y`` are optional and if not specified a Cartesian grid will be
used with a grid spacing of 1 in both directions.

To exclude grid points from the contour calculation then either use a NumPy
masked array for ``z`` with the excluded grid points masked out, or set the
``z`` values of those grid points to ``np.nan``.

Contour lines are implemented using a :class:`~bokeh.models.glyphs.MultiLine`
glyph and filled contour polygons as a :class:`~bokeh.models.glyphs.MultiPolygons`
glyph with the ``line_width`` set to zero.

The calculation of contours is performed by ``ContourPy``. For information
about this see the `ContourPy documentation <https://contourpy.readthedocs.io>`_.

.. note::

   Contouring was added to Bokeh version 3.0 and improvements are planned for
   future releases.
