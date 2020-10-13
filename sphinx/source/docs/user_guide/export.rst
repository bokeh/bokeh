.. _userguide_export:

Exporting plots
===============

Additional dependencies
-----------------------

You may need additional dependencies to use the |export| functions.
You can install these dependencies in several ways, including the
following:

• Using Conda:

.. code-block:: sh

    conda install selenium geckodriver firefox -c conda-forge

• Using ChromeDriver and the Chromium browser or a suitable alternative.

.. _userguide_export_png:

PNG generation
--------------

Bokeh can generate RGBA-format Portable Network Graphics (PNG) images from
layouts using the |export_png| function. This functionality renders the
layout in memory and then captures a screenshot. The output image will
have the same dimensions as the source layout.

To create a PNG with a transparent background set the
``Plot.background_fill_color`` and ``Plot.border_fill_color`` properties to
``None``.

Sizing variability
~~~~~~~~~~~~~~~~~~

Responsive sizing modes may generate layouts of unexpected size and aspect
ratio. For reliable results, use the default ``fixed`` sizing mode.

Example usage
~~~~~~~~~~~~~

Usage is similar to the |save| and |show| functions.

.. code-block:: python

    from bokeh.io import export_png

    export_png(plot, filename="plot.png")

.. image:: /_images/unemployment.png

Image objects
~~~~~~~~~~~~~

To access an image object through code without saving to a file, use the
lower-level function :func:`~bokeh.io.export.get_screenshot_as_png`.

.. code-block:: python

    from bokeh.io.export import get_screenshot_as_png

    image = get_screenshot_as_png(obj, height=height, width=width, driver=webdriver)

.. _userguide_export_svg:

SVG generation
--------------

Bokeh can also replace the HTML5 Canvas plot output with a Scalable Vector
Graphics (SVG) element that can be edited in image editing programs such
as Adobe Illustrator and/or converted to a PDF.

The SVG output isn't as performant as the default Canvas backend when it comes
to rendering a large number of glyphs or handling lots of user interactions like
panning.

To create an SVG with a transparent background, set the ``Plot.background_fill_color``
and ``Plot.border_fill_color`` properties to ``None``, same as with PNG output.

Limitations
~~~~~~~~~~~

You can't create a single SVG for a layout of plots because each plot will
produce its own distinct SVG element. You can, however, download an SVG plot
using a SaveTool from the toolbar. Note that in this case the exported file
will have a blank area where the toolbar used to be.

Example usage
~~~~~~~~~~~~~

To activate the SVG backend, set the ``Plot.output_backend`` attribute to
``"svg"``.

.. code-block:: python

    # option one
    plot = Plot(output_backend="svg")
    # option two
    plot.output_backend = "svg"

Exporting an SVG image
~~~~~~~~~~~~~~~~~~~~~~

The simplest way to manually export an SVG plot is to install the
`SVG-Crowbar`_ bookmarklet. Clicking it adds prompts to download
each plot as an SVG file. It is compatible with Chrome and should
work with Firefox in most cases.

You can also download an SVG plot with the ``SaveTool``, but it won't capture
the toolbar even though it figures into the plot layout solver calculations.

For headless export, use the |export_svgs| utility function similar to |save|
and |show|. This function downloads all SVG-enabled plots within a layout as
separate SVG files.

.. code-block:: python

    from bokeh.io import export_svgs

    plot.output_backend = "svg"
    export_svgs(plot, filename="plot.svg")

.. image:: /_images/unemployment.svg

.. |export|          replace:: :func:`~bokeh.io.export`
.. |export_png|      replace:: :func:`~bokeh.io.export_png`
.. |export_svgs|     replace:: :func:`~bokeh.io.export_svgs`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`

.. _SVG-Crowbar: http://nytimes.github.io/svg-crowbar/
