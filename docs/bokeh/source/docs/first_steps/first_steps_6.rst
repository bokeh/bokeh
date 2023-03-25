.. _first_steps_6:

First steps 6: Combining plots
==============================

In the :ref:`previous first steps guides <first_steps_5>`, you created
individual plots.

In this section, you will combine several plots into different kinds of layouts.

Creating rows, columns, and grids
---------------------------------

The easiest way to combine individual plots is to assign them to rows or
columns.

For example:

.. bokeh-plot:: docs/first_steps/examples/first_steps_6_row_layout.py
    :source-position: none

To combine several plots into a horizontal row layout, you first need to import
``row``. Then use the :func:`~bokeh.layouts.row` function when calling
``show()``:

.. literalinclude:: examples/first_steps_6_row_layout.py
   :language: python
   :emphasize-lines: 1,21

To display several plots in a vertical column layout, use the
:func:`~bokeh.layouts.column` function instead.

A more flexible way to arrange elements in Bokeh is to use the
:func:`~bokeh.layouts.gridplot` function.

.. seealso::
    For more information on ``row()``, ``column()``, and ``gridplot()``, see
    :ref:`ug_basic_layouts` in the user guide.

Defining sizing behavior
------------------------

You can use the functions ``row()``, ``column()``, and ``gridplot()`` with
additional arguments to define how Bokeh scales the individual plots. See
:class:`~bokeh.models.layouts.LayoutDOM.sizing_mode` for a list of all sizing
modes that Bokeh supports.

For example: To make all plots in a row responsively fill the available width
of the browser window, assign ``scale_width`` to ``sizing_mode``:

.. literalinclude:: examples/first_steps_6_row_layout_responsive.py
   :language: python
   :emphasize-lines: 22

.. bokeh-plot:: docs/first_steps/examples/first_steps_6_row_layout_responsive.py
    :source-position: none

.. seealso::
    For more information on sizing modes, see
    :ref:`ug_basic_layouts_sizing_mode` in the user guide.
