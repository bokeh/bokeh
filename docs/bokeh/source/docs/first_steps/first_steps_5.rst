.. _first_steps_5:

First steps 5: Vectorizing glyph properties
===========================================

In the :ref:`previous first steps guide <first_steps_4>`, you customized
various aspects of your plot by adding and changing attributes.

In this section, you will use vectors of data to influence aspects of your
plot and its elements.

.. _first_steps_5_colors:

Vectorizing colors
------------------

So far, you have assigned specific colors to a glyph by using properties such as
``fill_color``.

To change colors depending on values in a variable, pass a variable containing
color information to the ``fill_color`` attribute:

.. literalinclude:: examples/first_steps_5_vectorize_color.py
   :language: python
   :emphasize-lines: 10,22

.. bokeh-plot:: docs/first_steps/examples/first_steps_5_vectorize_color.py
    :source-position: none

In this example, the color of every circle corresponds to the y value of that
circle.

.. seealso::
    For more information on how to map data points to colors and color palettes,
    see :ref:`ug_basic_data_color_mapping` in the user guide.

.. _first_steps_5_colors_and_radii:

Vectorizing colors and sizes
----------------------------

To create a plot with colors and sizes in relation to your data, apply the same
principle to the ``radius`` argument of your renderer:

.. literalinclude:: examples/first_steps_5_vectorize_color_and_size.py
   :language: python
   :emphasize-lines: 11-12, 26-27

.. bokeh-plot:: docs/first_steps/examples/first_steps_5_vectorize_color_and_size.py
    :source-position: none

In this example, the color and diameter of every circle correspond to the y
value of that circle.

Color mapping with palettes
---------------------------------------

Bokeh comes with dozens of pre-defined color palettes that you can use to map
colors to your data. This includes palettes from `Brewer`_, `D3`_, or
`Matplotlib`_. See :class:`~bokeh.palettes` for a list of all available
palettes.

First, use the :func:`~bokeh.transform.linear_cmap` function to create a color
map for your data. The required attributes for this function are:

* ``field``: the data sequence to map colors to
* ``palette``: the palette to use
* ``low``: the lowest value to map a color to
* ``high``: the highest value to map a color to

Then assign your color mapper to the ``color`` parameter of your renderer:

.. literalinclude:: examples/first_steps_5_color_mapping.py
   :language: python
   :emphasize-lines: 2,4,11,17

.. bokeh-plot:: docs/first_steps/examples/first_steps_5_color_mapping.py
    :source-position: none

.. seealso::
   For more information about color mapping and other similar operations, see
   :ref:`ug_basic_data_color_mapping` and :ref:`ug_basic_data_transforming`
   in the user guide. In addition to ``linear_cmap``, this includes ``log_cmap``
   and ``factor_cmap``, for example.

   To learn more about Bokeh's color palettes, see :class:`~bokeh.palettes` in
   the reference guide. This document contains an overview of all available
   palettes and the various ways you can make those palettes available to your
   plots.

.. _Brewer: http://colorbrewer2.org/#type=sequential&scheme=BuGn&n=3
.. _D3: https://github.com/d3/d3-3.x-api-reference/blob/master/Ordinal-Scales.md#categorical-colors
.. _Matplotlib: https://matplotlib.org/examples/color/colormaps_reference.html
