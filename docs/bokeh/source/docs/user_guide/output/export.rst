.. _ug_output_export:

PNG and SVG export
==================

.. _ug_output_export_dependencies:

Additional dependencies
-----------------------

You will need the following additional dependencies to use the export
functions:

* `Selenium`_
* Either one of the following `web drivers`_:

  * geckodriver for Firefox
  * ChromeDriver for Chrome / Chromium

You can install these dependencies in various ways. The recommended way is to
use ``conda`` and install Selenium together with geckodriver.

.. tab-set::

    .. tab-item:: install with ``conda``

        .. tab-set::

          .. tab-item:: Selenium and geckodriver (Firefox):

              .. code-block:: sh

                  conda install selenium geckodriver -c conda-forge

              In order for geckodriver to work, you also need to have Firefox
              available on your system. See `Supported platforms`_ in the geckodriver
              documentation to make sure your version of Firefox is compatible.

              You can also install Firefox from conda-forge:

              .. code-block:: sh

                  conda install firefox -c conda-forge

              Installing Firefox with ``conda`` is helpful to make sure that you are
              running compatible versions of geckodriver and Firefox.

          .. tab-item:: Selenium and ChromeDriver (Chrome):

            .. code-block:: sh

                conda install selenium python-chromedriver-binary -c conda-forge

            After downloading and installing with ``conda``, make sure that the
            executable ``chromedriver`` (``chromedriver.exe`` on Windows) is
            available in your PATH. See the `chromedriver-binary documentation`_ for
            more information.

            ChromeDriver requires a compatible version of Google Chrome or Chromium
            to be available on your system. See the `ChromeDriver documentation`_
            for details about which version of ChromeDriver works with which
            version of Chrome or Chromium.

    .. tab-item:: install with ``pip``

        .. tab-set::

          .. tab-item:: Selenium and geckodriver (Firefox):

              .. code-block:: sh

                  pip install selenium

              After installing Selenium, you need to download and install the
              geckodriver binary from the `geckodriver repository on GitHub`_. Make
              sure that geckodriver is available in your PATH. See the
              `geckodriver documentation`_ for more information.

              In order for geckodriver to work, you also need to have Firefox
              available on your system. See `Supported platforms`_ in the geckodriver
              documentation to make sure your version of Firefox is compatible.

          .. tab-item:: Selenium and ChromeDriver (Chrome):

              .. code-block:: sh

                  pip install selenium chromedriver-binary

              After downloading and installing with ``pip``, make sure that the
              executable ``chromedriver`` (``chromedriver.exe`` on Windows) is
              available in your PATH. See the `chromedriver-binary documentation`_ for
              more information.

              ChromeDriver requires a compatible version of Google Chrome or Chromium
              to be available on your system. See the `ChromeDriver documentation`_
              for details about which version of ChromeDriver works with which
              version of Chrome or Chromium.

.. _ug_output_export_png:

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
    :alt: A categorical heatmap of monthly US unemployment data from 1948 to 2016 exported as a PNG. The x-axis is years and the y-axis is month of the year.

Image objects
~~~~~~~~~~~~~

To access an image object through code without saving to a file, use the
lower-level function :func:`~bokeh.io.export.get_screenshot_as_png`.

.. code-block:: python

    from bokeh.io.export import get_screenshot_as_png

    image = get_screenshot_as_png(obj, height=height, width=width, driver=webdriver)

.. _ug_output_export_svg:

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
    :alt: A categorical heatmap of monthly US unemployment data from 1948 to 2016 exported as an SVG. The x-axis is years and the y-axis is month of the year.

.. |export|          replace:: :func:`~bokeh.io.export`
.. |export_png|      replace:: :func:`~bokeh.io.export_png`
.. |export_svg|      replace:: :func:`~bokeh.io.export_svg`
.. |export_svgs|     replace:: :func:`~bokeh.io.export_svgs`

.. _Selenium: https://www.selenium.dev/documentation/en/
.. _web drivers: https://www.selenium.dev/documentation/en/webdriver/
.. _ChromeDriver documentation: https://chromedriver.chromium.org/
.. _geckodriver repository on GitHub: https://github.com/mozilla/geckodriver/releases
.. _geckodriver documentation: https://firefox-source-docs.mozilla.org/testing/geckodriver/Usage.html
.. _chromedriver-binary documentation: https://github.com/danielkaiser/python-chromedriver-binary#usage
.. _Supported platforms: https://firefox-source-docs.mozilla.org/testing/geckodriver/Support.html
.. _SVG-Crowbar: http://nytimes.github.io/svg-crowbar/
