.. _ug_styling_dom:

Styling DOM elements
====================

Bokeh has a few different mechanism for including CSS styles in output.

Styles
------

The :class:`~bokeh.models.css.Styles` class can be used to configure
inline style attribute of DOM elements directly:

.. code-block:: python

    style = Styles(
        display="grid",
        grid_template_columns="auto auto",
        column_gap="10px",
    )
    grid = Div(style=style)

Stylesheets
-----------

It is also possible to define and include stylesheets in generated output.
Bokeh provides a few different variations that can be used to apply CSS rules
to DOM objects in Bokeh output:

* :class:`~bokeh.models.css.InlineStyleSheet`

  Inline stylesheet equivalent to ``<style type="text/css">${css}</style>``.

* :class:`~bokeh.models.css.ImportedStyleSheet`

  Imported stylesheet equivalent to ``<link rel="stylesheet" href="${url}">``.

* :class:`~bokeh.models.css.GlobalInlineStyleSheet`

  Analogous to ``InlineStyleSheet`` but appended to the ``<head>`` element.

* :class:`~bokeh.models.css.GlobalImportedStyleSheet`

  Analogous to ``ImportedStyleSheet`` but appended to the ``<head>`` element.

The global variants are appended to ``<head>`` only once, so that the same
stylesheet model can be shared between various UI components efficiently.

For example:

.. code-block:: python

    from bokeh.models import InlineStyleSheet, Slider

    stylesheet = InlineStyleSheet(css=".bk-slider-title { background-color: lightgray; }")

    slider = Slider(value=10, start=0, end=100, step=0.5, stylesheets=[stylesheet])
