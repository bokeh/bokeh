.. _userguide_export:

Exporting Plots
===============

.. _userguide_export_png:

PNG Generation
--------------

Bokeh can generate RGBA-format Portable Network Graphics (PNG) images from
layouts using the |export| function. This functionality uses a headless browser
called WebKit to render the layout in memory and then capture a screenshot. The
generated image will be of the same dimensions as the source layout.

In order to create a PNG with a transparent background, users should set the
``Plot.background_fill_color`` and ``Plot.border_fill_color`` properties to
``None``.

.. warning::
    Responsive sizing_modes may generate layouts with unexpected size and
    aspect ratios. It is recommended to use the default ``fixed`` sizing mode.

.. warning::
    Glyphs that are rendered via webgl won't be included in the generated PNG.

Additional dependencies
~~~~~~~~~~~~~~~~~~~~~~~

In order to use the |export| function, users have to install some additional
dependencies. These dependencies can be installed via conda:

.. code-block:: sh

    conda install selenium phantomjs pillow

Alternatively, you can install phantomjs from npm via

.. code-block:: sh

    npm install -g phantomjs-prebuilt

Example usage
~~~~~~~~~~~~~

Usage is similar to the |save| and |show| functions.

.. code-block:: python

    from bokeh.io import export

    export(plot, filename="plot.png")

.. image:: /_images/unemployment.png

.. |export|          replace:: :func:`~bokeh.io.export`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`
