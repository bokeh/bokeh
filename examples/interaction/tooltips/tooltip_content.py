''' A visualization of adding tooltips to widgets in bokeh.models.
This example demonstrates defining two distinct tooltip widgets,
i.e. plaintext and html tooltip, and accepting text input through those widgets.

.. bokeh-example-metadata::
    :apis: bokeh.io.show, bokeh.models.TextInput, Bokeh.models.Tooltip
    :refs: ref:`ug_interaction_tooltips`
    :keywords: tooltip
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
