''' Add plain-text and HTML tooltips to two text input widgets.

.. bokeh-example-metadata::
    :title: Plain-text and HTML widget tooltips
    :example-ref: ug_interaction_tooltip_contents
    :apis: bokeh.io.show, bokeh.models.TextInput, bokeh.models.Tooltip
    :refs: :ref:`ug_interaction_tooltips`
    :keywords: HTML tooltip, widget tooltip
'''
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import TextInput, Tooltip
from bokeh.models.dom import HTML

plaintext_tooltip = Tooltip(content="plain text tooltip", position="right")
html_tooltip = Tooltip(content=HTML("<b>HTML</b> tooltip"), position="right")

input_with_plaintext_tooltip = TextInput(value="default", title="Label:", description=plaintext_tooltip)
input_with_html_tooltip = TextInput(value="default", title="Label2:", description=html_tooltip)

show(column(input_with_plaintext_tooltip, input_with_html_tooltip))
