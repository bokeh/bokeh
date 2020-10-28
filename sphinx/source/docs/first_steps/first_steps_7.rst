.. _first_steps_7:

First steps 7: Displaying and exporting
=======================================

In the :ref:`previous first steps guides <first_steps_6>`, you created and
customized, and combined visualizations.

In this section, you will use different methods to display and export your
visualizations.

.. _first_steps_7_html_file:

Creating a standalone HTML file
-------------------------------

All examples so far have used the :func:`~bokeh.io.output_file` function to
save your visualization to an HTML file. This HTML file contains all necessary
information to display your plot.

``output_file()`` accepts various arguments. For exaple:

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

.. seealso::
    For more information on using Jupyter notebooks, see
    :ref:`userguide_jupyter` in the user guide.

    Interact directly with `live tutorial notebooks <https://mybinder.org/v2/gh/bokeh/bokeh-notebooks/master?filepath=tutorial%2F00%20-%20Introduction%20and%20Setup.ipynb>`_
    hosted online by MyBinder.

.. _first_steps_7_export_png_svg:

Exporting to PNG and SVG
------------------------

To export PNG or SVG files, you might need to install additional dependencies.

In order to 

* If you are using conda:
    .. code-block:: sh

        from bokeh.plotting import figure, output_file, show

PREREQUISITES additional packages (required for png and scg files!!)

PNG

SVGs

SVG
if you have a gridplot layout of several plots, svgs will give you individual
files. Use export_svg to get one file with all of them...

export png
https://docs.bokeh.org/en/latest/docs/user_guide/export.html



.. panels::
    :column: col-lg-6 col-md-6 col-sm-6 col-xs-12 p-2

    .. link-button:: first_steps_5.html
        :text: Previous
        :classes: stretched-link

    ---
    :card: + text-right
    .. link-button:: first_steps_7.html
        :text: Next
        :classes: stretched-link
