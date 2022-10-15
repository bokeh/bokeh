.. _ug_styling_palettes_mappers:

Palettes and mappers
====================


Using mappers
-------------

Use Bokeh's color mappers to encode a sequence of data into a palette of colors
that are based on the values in that sequence. You can then set a marker
object's ``color`` attribute to your color mapper. Bokeh includes several types
of mappers to encode colors:

* |factor_cmap|: Maps colors to specific categorical elements.
  See :ref:`ug_basic_bars` for more detail.
* :func:`~bokeh.transform.linear_cmap`: Maps a range of numeric values across the
  available colors from high to low. For example, a range of `[0,99]` given the
  colors `['red', 'green', 'blue']` would be mapped as follows::

        x < 0  : 'red'     # values < low are clamped
    0 >= x < 33 : 'red'
    33 >= x < 66 : 'green'
    66 >= x < 99 : 'blue'
    99 >= x      : 'blue'    # values > high are clamped

* :func:`~bokeh.transform.log_cmap`: Similar to ``linear_cmap`` but uses a natural
  log scale to map the colors.

These mapper functions return a ``DataSpec`` property. Pass this property to
the color attribute of the glyph you want to use it with.

The dataspec that the mapper function returns includes a ``bokeh.transform``.
You can access this data to use the result of the mapper function in a different
context. To create a ``ColorBar``, for example:

.. bokeh-plot:: __REPO__/examples/styling/palettes_mappers/linear_mappers.py
    :source-position: above
