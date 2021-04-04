.. _first_steps_7:

First steps 7: Displaying and exporting
=======================================

In the :ref:`previous first steps guides <first_steps_6>`, you created and
customized, and combined visualizations.

In this section, you will use various methods to display and export your
visualizations.

.. _first_steps_7_html_file:

Creating a standalone HTML file
-------------------------------

All examples so far have used the :func:`~bokeh.io.output_file` function to
save your visualization to an HTML file. This HTML file contains all the
necessary information to display your plot.

``output_file()`` accepts various arguments. For example:

* ``filename``: the filename for the HTML file
* ``title``: the title for you document (to be used in the HTML's ``<title>``
  tag)

Bokeh creates the HTML file when you call the :func:`~bokeh.io.show` function.
This function also automatically opens a web browser to display the HTML file.

If you want Bokeh to only generate the file but not open it in a web browser,
use the :func:`~bokeh.io.save` function instead. You need to import the
``save()`` function before using it, just like you did for ``show()``.

.. literalinclude:: examples/first_steps_7_export_html.py
   :language: python
   :emphasize-lines: 1,8,17

.. seealso::
    For more information on embedding Bokeh visualizations online, see
    :ref:`userguide_embed` in the user guide.

.. note::
    By default, Bokeh-generated HTML files include a standard version of BokehJS
    that is automatically downloaded from Bokeh's servers. Use the argument
    ``mode`` with the function ``output_file()`` to change this behavior. For
    more information, see :class:`~bokeh.io.output_file` and
    :class:`~bokeh.resources.Resources` in the reference guide.

.. _first_steps_7_jupyter_notebook:

Displaying in a Jupyter notebook
--------------------------------

If you use Jupyter notebooks, switch out Bokeh's :func:`~bokeh.io.output_file`
for :func:`~bokeh.io.output_notebook`.

Use the :func:`~bokeh.io.show` function to display your visualization right
inside your notebook:

.. image:: /_images/notebook_inline.png
    :scale: 50 %
    :align: center
    :alt: Screenshot of a Bokeh plot in a Jupyter notebook

.. seealso::
    For more information on using Jupyter notebooks, see
    :ref:`userguide_jupyter` in the user guide.

    Interact directly with `live tutorial notebooks <https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/master?filepath=tutorial%2F00%20-%20Introduction%20and%20Setup.ipynb>`_
    hosted online by MyBinder.

.. _first_steps_7_export_png_svg:

Exporting PNG files
-------------------

To export PNG or SVG files, you might need to install additional dependencies.

In order to create PNG and SVG files, Bokeh uses
`Selenium <https://github.com/SeleniumHQ/selenium>`_. Selenium allows Bokeh to
run in a browser without a graphical user interface (GUI). Bokeh uses this
browser to render the PNG or SVG files. In order for this to work, Selenium
needs to be able to access either a Firefox browser (through a package called
geckodriver) or a Chromium browser (through the chromedriver package).

Depending on whether you are using ``conda`` or ``pip``, run one of the
following commands to make sure you have all the required packages installed:

.. panels::

    Installing with ``conda``
    ^^^^^^^^^^^^^^^^^^^^^^^^^

    .. code-block:: sh

        conda install selenium geckodriver firefox -c conda-forge

    ---

    Installing with ``pip``
    ^^^^^^^^^^^^^^^^^^^^^^^

    .. code-block:: sh

        pip install selenium geckodriver firefox

Once the requirements are installed, you can use the
:func:`~bokeh.io.export_png` function to export your plot into a PNG file:

.. literalinclude:: examples/first_steps_7_export_png.py
   :language: python
   :emphasize-lines: 1,15

.. seealso::
    For information on how to export PNG and SVG files, see
    :ref:`userguide_export` in the user guide.
