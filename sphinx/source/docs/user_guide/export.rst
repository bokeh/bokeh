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

.. _userguide_export_svg:

SVG Generation
--------------

Bokeh also supports replacing the HTML5 Canvas plot output with an SVG element
that can be edited in image editing programs such as Adobe Illustrator and/or
converted to PDFs. This functionality uses a JavaScript library called
canvas2svg to mock the normal Canvas element and its methods with an SVG
element.

The SVG output isn't as performant as the default Canvas backend when it comes
to rendering large number of glyphs or handling lots of user interactions like
panning.

Like PNGs, in order to create a SVG with a transparent background, users
should set the ``Plot.background_fill_color`` and ``Plot.border_fill_color``
properties to ``None``.

.. warning::
    It's not possible to generate a single SVG for a layout of plots, as each
    plot is it's own distinct SVG element.

.. warning::
    Glyphs that are rendered via webgl and overlaid HTML elements such as
    the toolbar will be rendered in the HTML output but won't be included
    in any exported SVG.

Example usage
~~~~~~~~~~~~~

The SVG backend is activated by setting the ``Plot.output_backend`` attribute
to ``"svg"`.

.. code-block:: python

    # option one:
    plot = Plot(output_backend="svg")
    # option two:
    plot.output_backend = "svg"

.. image:: /_images/unemployment.svg

Exporting a SVG Image
~~~~~~~~~~~~~~~~~~~~~

The simplest way to export a SVG plot is to install a browser bookmarklet from
the New York Times called `SVG-Crowbar`_. When clicked, it runs a snippet of
JavaScript and adds a prompt on the page to download the plot. It's written to
work with Chrome and should work with Firefox in most cases.

Alternatively, it's possible to download a SVG plot using the ``SaveTool``, but
the toolbar isn't captured though it figures into the plot layout solver
calculations. It's not great, but a workable option.

.. |export|          replace:: :func:`~bokeh.io.export`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`

.. _SVG-Crowbar: http://nytimes.github.io/svg-crowbar/
