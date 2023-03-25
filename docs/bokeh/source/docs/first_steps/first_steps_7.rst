.. _first_steps_7:

First steps 7: Displaying and exporting
=======================================

In the :ref:`previous first steps guides <first_steps_6>`, you created,
customized, and combined visualizations.

In this section, you will use various methods to display and export your
visualizations.

.. _first_steps_7_html_file:

Creating a standalone HTML file
-------------------------------

All examples so far have used the |show| function to save your visualization to
an HTML file. This HTML file contains all the necessary information to display
your plot.

To customize the file Bokeh creates for your visualization, import and call the
|output_file| function. ``output_file()`` accepts various file-related
arguments. For example:

* ``filename``: the filename for the HTML file
* ``title``: the title for you document (to be used in the HTML's ``<title>``
  tag)

If you don't use the ``output_file()`` function to define a custom file name,
Bokeh defaults to using the file name of the currently running Python script for
the filename of the HTML output. If a script filename is not available (for
instance, in a Jupyter notebook), then Bokeh will generate a random filename.

Bokeh creates the HTML file when you call the |show| function. This function
also automatically opens a web browser to display the HTML file.

If you want Bokeh to only generate the file but not open it in a web browser,
use the |save| function instead.

You need to import the |save| and |output_file| functions before using,
just like you did for |show|.

.. literalinclude:: examples/first_steps_7_export_html.py
   :language: python
   :emphasize-lines: 1,8,17

.. seealso::
    For more information on embedding Bokeh visualizations online, see
    :ref:`ug_output_embed` in the user guide.

.. note::
    By default, Bokeh-generated HTML files include a standard version of BokehJS
    that is automatically downloaded from Bokeh's servers. Use the argument
    ``mode`` with the function ``output_file()`` to change this behavior. For
    more information, see |output_file| and :class:`~bokeh.resources.Resources`
    in the reference guide.

.. _first_steps_7_jupyter_notebook:

Displaying in a Jupyter notebook
--------------------------------

If you use Jupyter notebooks, call Bokeh's |output_notebook| function in your
code. Then, use the |show| function to display your visualization right inside
your notebook:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of a Bokeh plot in a Jupyter notebook

.. seealso::
    For more information on using Jupyter notebooks, see
    :ref:`ug_output_jupyter` in the user guide.

    Interact directly with `live tutorial notebooks <https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/HEAD?labpath=index.ipynb>`_
    hosted online by MyBinder.

.. _first_steps_7_export_png_svg:

Exporting PNG files
-------------------

To export PNG or SVG files, you might need to install additional dependencies.

In order to create PNG and SVG files, Bokeh uses
`Selenium <https://github.com/SeleniumHQ/selenium>`_. Selenium allows Bokeh to
run in a browser without a graphical user interface. Bokeh uses this
browser to render the PNG or SVG files. In order for this to work, Selenium
needs to be able to access either a Firefox browser (through the geckodriver
package) or a Chrome/Chromium browser (through the chromedriver package).

Use this command to install Selenium with geckodriver and Firefox in a conda
environment:

.. code-block:: sh

    conda install selenium geckodriver firefox -c conda-forge

See :ref:`ug_output_export_dependencies` for more options to install the
required packages.

Once the requirements are installed, you can use the
:func:`~bokeh.io.export_png` function to export your plot into a PNG file:

.. literalinclude:: examples/first_steps_7_export_png.py
   :language: python
   :emphasize-lines: 1,15

.. seealso::
    For information on how to export PNG and SVG files, see
    :ref:`ug_output_export` in the user guide.
