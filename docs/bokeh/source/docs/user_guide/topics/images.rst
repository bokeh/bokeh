.. _ug_topics_images:

Images and raster data
======================

You can display 2d image arrays on Bokeh plots using the |image| and
|image_rgba| glyph methods. You can use hovering tooltips with image glyphs
to let the user see the values of each pixel. For more information on how to
enable hovering tooltips for images, see
:ref:`Image hover <ug_interaction_tools_image_hover>`.

Raw RGBA data
-------------

The following example shows how to display images using raw RGBA data with the
|image_rgba| method.

.. bokeh-plot:: __REPO__/examples/topics/images/image_rgba.py
    :source-position: above

.. _ug_topics_images_colormapped:

Color mapped images
-------------------

The following example shows how to supply an array of *scalar values* and have
Bokeh automatically color map the data in the browser with the |image| glyph
method.

.. bokeh-plot:: __REPO__/examples/topics/images/image.py
    :source-position: above

Note that this example sets the render level to ``"image"``. Normally, Bokeh
draws all glyphs *above* grid lines, but with this render level they appear
*below* the grid lines.

Origin and Anchor
-----------------

The |image| and |image_rgba| glyphs provide ``origin`` and ``anchor``
properties for controlling the relative position and orientation of the
image.

When drawn, the image will cover a rectangular drawing region of size
``dw`` by ``dh``.

The ``anchor`` property specifies where that rectangular drawing region
is located, relative to the glyph coordinates ``x`` and ``y``. It can be
used to shift the image vertically or horizontally from ``x`` and ``y``.

The ``origin`` property specifies which corner of the rectangular drawing
region corresponds to the ``[0, 0]`` pixel of the image array. It can be
used to flip the image vertically or horizontally within its drawing region.

The example below lets you explore all the different combinations of
``anchor`` an ``origin`` for a simple 2x2 image.

.. bokeh-plot:: __REPO__/examples/topics/images/image_origin_anchor.py
    :source-position: none

.. |image|             replace:: :func:`~bokeh.plotting.figure.image`
.. |image_rgba|        replace:: :func:`~bokeh.plotting.figure.image_rgba`
