.. _ug_styling_dom:

Styling DOM elements
====================

Adding CSS classes
------------------
.. bokeh-plot:: __REPO__/examples/styling/dom/css_classes.py
    :source-position: above

Styles
------

:class:`~bokeh.models.css.Styles` allows to configure style attribute of DOM elements.

.. code-block:: python

    style = Styles(
        display="grid",
        grid_template_columns="auto auto",
        column_gap="10px",
    )
    grid = Div(style=style)

Stylesheets
-----------

Bokeh defines different variations of a style sheet object that can be
used to apply CSS rules to the DOM elements that are generated in Bokeh
output:

* :class:`~bokeh.models.css.InlineStyleSheet`

  Inline stylesheet equivalent to ``<style type="text/css">${css}</style>``.

* :class:`~bokeh.models.css.ImportedStyleSheet`

  Imported stylesheet equivalent to ``<link rel="stylesheet" href="${url}">``.

* :class:`~bokeh.models.css.GlobalInlineStyleSheet`

    Analogous ``InlineStyleSheet`` but appended to the ``<head>`` element.

* :class:`~bokeh.models.css.GLobalImportedStyleSheet`

    Analogous ``ImportedStyleSheet`` but appended to the ``<head>`` element.

The global variants are appended to ``<head>`` only once, so that the same
stylesheet model can be shared between various UI components efficiently.

For example:

.. code-block:: python

    from bokeh.models import InlineStyleSheet

    stylesheet = InlineStyleSheet(css=".bk-slider-title { background-color: lightgray; }")

    slider = Slider(value=10, start=0, end=100, step=0.5, stylesheets=[stylesheet])
