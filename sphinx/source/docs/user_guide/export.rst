.. _userguide_export:

Exporting plots
===============

Additional dependencies
-----------------------

You will need the following additional dependencies to use the |export|
functions:

* Selenium
* And either of the following:

  * GeckoDriver for Firefox, OR
  * ChromeDriver for Chrome / Chromium

You can install these dependencies from `Conda`_ as follows:

* For Selenium with GeckoDriver:

  .. code-block:: sh

    conda install selenium geckodriver -c conda-forge

* For Selenium with ChromeDriver:

  .. code-block:: sh

    conda install selenium python-chromedriver-binary -c conda-forge

.. _userguide_export_png:

Exporting PNG images
--------------------

Bokeh can generate RGBA-format Portable Network Graphics (PNG) images from
layouts using the |export_png| function. This functionality renders the
layout in memory and then captures a screenshot. The output image will
have the same dimensions as the source layout.

To create a PNG with a transparent background set the
``Plot.background_fill_color`` and ``Plot.border_fill_color`` properties to
``None``.

.. code-block:: python

    plot.background_fill_color = None
    plot.border_fill_color = None

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

Exporting SVG images
--------------------

Bokeh can also replace the HTML5 Canvas plot output with a Scalable Vector
Graphics (SVG) element that can be edited in image editing programs such
as Adobe Illustrator and/or converted to PDF.

The SVG output isn't as performant as the default Canvas backend when it comes
to rendering a large number of glyphs or handling lots of user interactions such
as panning.

To activate the SVG backend, set the ``Plot.output_backend`` attribute to
``"svg"``.

.. code-block:: python

    # option one
    plot = Plot(output_backend="svg")
    # option two
    plot.output_backend = "svg"

To create an SVG with a transparent background, set the
``Plot.background_fill_color`` and ``Plot.border_fill_color``
properties to ``None``, same as for PNG exports.

You can export an SVG plot in several ways:

* With code:

  * Use the |export_svg| utility function that lets you
    save a plot or a layout of plots as a single SVG file.

    .. code-block:: python

      from bokeh.io import export_svg

      export_svg(plot, filename="plot.svg")

  * Use the |export_svgs| utility function that lets you
    export a layout of plots as a set of independent SVG
    files.

    .. code-block:: python

      from bokeh.io import export_svgs

      export_svgs(plot, filename="plot.svg")

* From browser:

  * Use the `SVG-Crowbar`_ bookmarklet that adds a prompt to
    download each plot as an SVG file. This tool is fully
    compatible with Chrome and should work with Firefox in
    most cases.
  * Use the ``SaveTool`` from the toolbar but note that the
    exported files will have a blank area where the toolbar
    was.

.. image:: /_images/unemployment.svg

.. |export|          replace:: :func:`~bokeh.io.export`
.. |export_png|      replace:: :func:`~bokeh.io.export_png`
.. |export_svg|      replace:: :func:`~bokeh.io.export_svg`
.. |export_svgs|     replace:: :func:`~bokeh.io.export_svgs`
.. |save|            replace:: :func:`~bokeh.io.save`
.. |show|            replace:: :func:`~bokeh.io.show`

.. _Conda: https://docs.bokeh.org/en/latest/docs/dev_guide/setup.html?highlight=conda#id4
.. _SVG-Crowbar: http://nytimes.github.io/svg-crowbar/
