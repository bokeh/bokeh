.. _ug_basic_text:

Text glyphs
===========

.. _ug_basic_text_labels:

Text labels
-----------

To draw text labels positioned by data, use the |text| glyph method. To
configure the labels, use a data source that contains columns with data for
the labels' properties such as ``text``, ``x`` and ``y``. If you assign a value
to a property such as ``x_offset`` and ``y_offset`` directly instead of a column
name, this value is used for all labels.

.. code-block:: python

    p.text(x="x", y="y", text="names", x_offset=5, y_offset=5, source=source)

These are the most commonly used properties of the |Text| glyph:

* ``x`` and ``y``: The coordinates of the labels, in |data units|.
* ``text``: The text of the labels. The text may contain newline characters,
  which result in multi-line labels. Labels with ``None`` text are not drawn.
* ``x_offset`` and ``y_offset``: Offsets, in |screen units|, that shift the
  labels relative to their ``x`` and ``y`` coordinates.
* ``angle``: The rotation of the labels.
* ``anchor``: The point of a label's box that is placed at its position, e.g.
  ``"top_left"`` or ``"center"``. By default, it is derived from
  ``text_align`` and ``text_baseline``.
* ``padding`` and ``border_radius``: The spacing between the text and its box
  and the rounding of the box's corners.
* The standard |text properties|, as well as ``background_fill``,
  ``background_hatch`` and ``border_line`` properties, which style the box
  around each label.

.. bokeh-plot:: __REPO__/examples/basic/text/text_labels.py
    :source-position: above

To add a single label positioned relative to the plot, such as a caption or a
note, use the |Label| annotation instead. See :ref:`ug_basic_annotations_labels`.

.. |text|          replace:: :func:`~bokeh.plotting.figure.text`

.. |Label|         replace:: :class:`~bokeh.models.annotations.Label`
.. |Text|          replace:: :class:`~bokeh.models.glyphs.Text`
