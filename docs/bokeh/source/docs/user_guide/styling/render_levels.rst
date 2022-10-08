.. _ug_styling_render_levels:

Setting render levels
=====================

To specify the order in which things are drawn, use one of the following render
levels:

:image:
    "lowest" render level, drawn before anything else
:underlay:
    default render level for grids
:glyph:
    default render level for all glyphs (which means they are drawn above grids)
:annotation:
    default render level for annotation renderers
:overlay:
    "highest" render level, for tool overlays

Within a given level, renderers are drawn in the order that they were added.

To specify a render level explicitly, use the ``level`` parameter on the
renderer.

For example, to make sure an image is rendered *under* the grid lines, assign
the render level ``"image"`` to the ``level`` argument when calling your
``image`` renderer:

.. code-block:: python

    p.image(..., level="image")

You can see a complete example with output in the section
:ref:`ug_topics_images_colormapped`.
