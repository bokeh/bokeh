.. _ug_styling_palettes_mappers:

Palettes and mappers
====================

.. _ug_styling_palettes_mappers_palettes:

Using palettes
--------------

Palettes are sequences of RGB(A) hex strings that define a colormap. The
sequences you use for defining colormaps can be either lists or tuples. Once you
have created a colormap, you can use it with the ``color`` attribute of many
plot objects from |bokeh.plotting|.

Bokeh includes several pre-defined palettes, such as the standard Brewer
palettes. To use one of those pre-defined palettes, import it from the
``bokeh.palettes`` module. When you import "Spectral6", for example, Bokeh gives
you access to a six element list of RGB(A) hex strings from the Brewer
"Spectral" colormap:

.. code-block:: python

    >>> from bokeh.palettes import Spectral6
    >>> Spectral6
    ['#3288bd', '#99d594', '#e6f598', '#fee08b', '#fc8d59', '#d53e4f']

For a list of all the standard palettes included in Bokeh, see
:ref:`bokeh.palettes`.

You can also create custom palettes by defining a sequence of RGB(A) hex
strings yourself.

.. _ug_styling_palettes_mappers_mappers:

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
