.. _ug_specialized_hex:

Hex tiles
=========

Hex tile glyphs
---------------

Bokeh can plot hexagonal tiles, which you can use to show binned aggregations
and more. The :func:`~bokeh.plotting.figure.hex_tile` method takes a ``size``
parameter to define the size of the hex grid and `axial coordinates`_ to
specify the tiles.

.. bokeh-plot:: docs/user_guide/examples/plotting_hex_tile_basic.py
    :source-position: above

Hex binning
-----------

A more practical example below computes counts per bin using the
:func:`~bokeh.util.hex.hexbin` function and plots the color mapped counts.

.. bokeh-plot:: docs/user_guide/examples/plotting_hex_tile_binning.py
    :source-position: above

You can simplify this code by calling the :func:`~bokeh.plotting.figure.hexbin`
method of |figure|.

.. _axial coordinates: https://www.redblobgames.com/grids/hexagons/#coordinates-axial
