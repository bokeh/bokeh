.. _ug_styling_visuals:

General visual properties
=========================

To style the visual attributes of Bokeh plots, you need to know what the
available properties are. The full |reference guide| contains all properties of
every object individually. However, there are three groups of properties that
many objects have in common. They are:

* **line properties**: line color, width, etc.
* **fill properties**: fill color, alpha, etc.
* **text properties**: font styles, colors, etc.

This section contains more details about some of the most common properties.

.. _ug_styling_line_properties:

Line properties
~~~~~~~~~~~~~~~

.. include:: ../../includes/line_props.rst

.. _ug_styling_fill_properties:

Fill properties
~~~~~~~~~~~~~~~

.. include:: ../../includes/fill_props.rst

.. _ug_styling_hatch_properties:

Hatch properties
~~~~~~~~~~~~~~~~

.. include:: ../../includes/hatch_props.rst

.. _ug_styling_text_properties:

Text properties
~~~~~~~~~~~~~~~

.. include:: ../../includes/text_props.rst

.. _ug_styling_visible_property:

Visible property
~~~~~~~~~~~~~~~~

Glyph renderers, axes, grids, and annotations all have a ``visible`` property.
Use this property to turn them on and off.

.. bokeh-plot:: __REPO__/examples/styling/visuals/visible_property.py
    :source-position: above

This can be particularly useful in interactive examples with a Bokeh server or
CustomJS.

.. bokeh-plot:: __REPO__/examples/styling/visuals/visible_annotation_with_interaction.py
    :source-position: above

.. _ug_styling_colors:

Color properties
~~~~~~~~~~~~~~~~

Bokeh objects have several properties related to colors. Use those color
properties to control the appearance of lines, fills, or text, for example.

Use one of these options to define colors in Bokeh:

- Any of the |named CSS colors|, such as ``'green'`` or ``'indigo'``. You can
  also use the additional name ``'transparent'`` (equal to ``'#00000000'``).
- An RGB(A) hex value, such as ``'#FF0000'`` (without alpha information) or
  ``'#44444444'`` (with alpha information).
- A CSS4 ``rgb()``, ``rgba()``, or ``hsl()``
  `color string <https://www.w3.org/TR/css-color-4/>`_, such as
  ``'rgb(0 127 0 / 1.0)'``, ``'rgba(255, 0, 127, 0.6)'``, or
  ``'hsl(60deg 100% 50% / 1.0)'``.
- A 3-tuple of integers ``(r, g, b)`` (where *r*, *g*, and *b* are integers
  between 0 and 255).
- A 4-tuple of ``(r, g, b, a)`` (where *r*, *g*, and *b* are integers between 0
  and 255 and *a* is a floating-point value between 0 and 1).
- A 32-bit unsigned integer representing RGBA values in a 0xRRGGBBAA
  byte order pattern, such as ``0xffff00ff`` or ``0xff0000ff``.

To define a series of colors, use an array of color data such as a list or the
column of a |ColumnDataSource|. This also includes
`NumPy arrays <https://numpy.org/doc/stable/reference/generated/numpy.array.html>`_.

For example:

.. bokeh-plot:: __REPO__/examples/styling/visuals/specifying_colors.py
    :source-position: above

In addition to specifying the alpha value of a color when defining the color
itself, you can also set an alpha value separately by using the
``line_alpha`` or ``fill_alpha`` properties of a glyph.

If you specify a color with an alpha value and also explicitly provide an
alpha value through a ``line_alpha`` or ``fill_alpha`` property at the same
time, then the alpha values are combined by multiplying them together. For
example, if your color is ``'#00FF0044'`` or ``'rgba(255, 0, 127, 0.6)'``
and your separate alpha value is ``0.5`` then the alpha value used for the
glyph will be ``0.6*0.5 = 0.3``.

The following figure demonstrates each possible combination of using RGB and
RGBA colors together with the ``line_alpha`` or ``fill_alpha`` properties:

.. bokeh-plot:: __REPO__/examples/styling/visuals/specifying_colors_properties.py
    :source-position: none

.. note::
    If you use
    :ref:`Bokeh's plotting interface <ug_interfaces_plotting>`, you also
    have the option to specify ``color`` and/or ``alpha`` as keywords when
    calling a renderer method. Bokeh automatically applies these values to the
    corresponding ``fill`` and ``line`` properties of your glyphs.

    You then still have the option to provide additional ``fill_color``,
    ``fill_alpha``, ``line_color``, and ``line_alpha`` arguments as well. In
    this case, the former will take precedence.

.. _ug_styling_visual_palettes:

Color palettes
--------------

Bokeh provides a number of pre-defined color palettes that you can reference to
define colors, including for :ref:`color mapping <ug_basic_data_color_mapping>`.

Bokeh's pre-defined palettes are sequences of RGB(A) hex strings. These
sequences can be either lists or tuples.

To use one of those pre-defined palettes, import it from the ``bokeh.palettes``
module.

When you import ``"Spectral6"``, for example, Bokeh gives you access to a list that
contains six RGB(A) hex strings from the Brewer ``"Spectral"`` color map:

.. code-block:: python

    >>> from bokeh.palettes import Spectral6
    >>> Spectral6
    ['#3288bd', '#99d594', '#e6f598', '#fee08b', '#fc8d59', '#d53e4f']

For a list of all the standard palettes included in Bokeh, see
:ref:`bokeh.palettes`.

.. _ug_styling_units:

Screen units and data-space units
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When setting visual properties of Bokeh objects, you use either screen units or
data-space units:

* Screen units use raw numbers of pixels to specify height or width
* Data-space units are relative to the data and the axes of the plot

Take a 400 pixel by 400 pixel graph with x and y axes ranging from 0
through 10, for example. A glyph that is one fifth as wide and tall as the graph
would have a size of 80 screen units or 2 data-space units.

Objects in Bokeh that support both screen units and data-space units usually
have a dedicated property to choose which unit to use. This unit-setting
property is the name of the property with an added ``_units``. For
example: A :class:`~bokeh.models.annotations.Whisker`
:ref:`annotation <ug_basic_annotations_whiskers>` has the property ``upper``. To
define which unit to use, set the ``upper_units`` property to either
``'screen'`` or ``'data'``.
