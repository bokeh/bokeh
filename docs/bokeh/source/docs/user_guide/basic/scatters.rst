.. _ug_basic_scatters:

Scatter plots
=============

.. _ug_basic_scatters_markers:

Scatter markers
---------------

Bokeh includes a large variety of markers for creating scatter plots. For
example, to render circle scatter markers on a plot, use the |circle|
method of |figure|:

.. bokeh-plot:: __REPO__/examples/basic/scatters/scatter_circle.py
    :source-position: above

Similarly, use the :func:`~bokeh.plotting.figure.square` method of |figure| to
scatter square markers on a plot:

.. bokeh-plot:: __REPO__/examples/basic/scatters/scatter_square.py
    :source-position: above

Bokeh's built-in scatter markers consist of a set of base markers, most of which
can be combined with different kinds of additional visual features. This is an
overview of all available scatter markers:

.. bokeh-plot:: __REPO__/examples/basic/scatters/markertypes.py
    :source-position: none

To see details and example plots for any of the available scatter markers, click
on the corresponding glyph method in the following list:

.. hlist::
    :columns: 3

    * :func:`~bokeh.plotting.figure.asterisk`
    * :func:`~bokeh.plotting.figure.circle`
    * :func:`~bokeh.plotting.figure.circle_cross`
    * :func:`~bokeh.plotting.figure.circle_dot`
    * :func:`~bokeh.plotting.figure.circle_x`
    * :func:`~bokeh.plotting.figure.circle_y`
    * :func:`~bokeh.plotting.figure.cross`
    * :func:`~bokeh.plotting.figure.dash`
    * :func:`~bokeh.plotting.figure.diamond`
    * :func:`~bokeh.plotting.figure.diamond_cross`
    * :func:`~bokeh.plotting.figure.diamond_dot`
    * :func:`~bokeh.plotting.figure.dot`
    * :func:`~bokeh.plotting.figure.hex`
    * :func:`~bokeh.plotting.figure.hex_dot`
    * :func:`~bokeh.plotting.figure.inverted_triangle`
    * :func:`~bokeh.plotting.figure.plus`
    * :func:`~bokeh.plotting.figure.square`
    * :func:`~bokeh.plotting.figure.square_cross`
    * :func:`~bokeh.plotting.figure.square_dot`
    * :func:`~bokeh.plotting.figure.square_pin`
    * :func:`~bokeh.plotting.figure.square_x`
    * :func:`~bokeh.plotting.figure.star`
    * :func:`~bokeh.plotting.figure.star_dot`
    * :func:`~bokeh.plotting.figure.triangle`
    * :func:`~bokeh.plotting.figure.triangle_dot`
    * :func:`~bokeh.plotting.figure.triangle_pin`
    * :func:`~bokeh.plotting.figure.x`
    * :func:`~bokeh.plotting.figure.y`

All the markers have the same set of properties: ``x``, ``y``, ``size`` (in
|screen units|), and ``angle`` (in radians by default). The |circle| marker is
an exception: this method accepts an additional ``radius`` property that you can
use with |data units|.

.. _ug_basic_scatters_urls:

Image URLs
----------

It is also possible to make scatter plots using arbitrary images for markers
using the |image_url| glyph method. The example below demonstrates using a
single image, but it is possible to pass a column of different URLs for every
point.

.. note::
    The URLs must be accessible by HTTP or HTTPS. For security reasons,
    browsers will not allow loading local (``file://``) images into HTML
    canvas elements. For similar reasons, if the page is HTTPS, then the
    URLs for the images must also be HTTPS.

.. bokeh-plot:: __REPO__/examples/basic/scatters/image_url.py
    :source-position: none

.. |circle|    replace:: :func:`~bokeh.plotting.figure.circle`
.. |image_url| replace:: :func:`~bokeh.plotting.figure.image_url`
