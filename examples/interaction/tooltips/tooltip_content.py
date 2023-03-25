from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import TextInput, Tooltip
from bokeh.models.dom import HTML

plaintext_tooltip = Tooltip(content="plain text tooltip", position="right")
html_tooltip = Tooltip(content=HTML("<b>HTML</b> tooltip"), position="right")

input_with_plaintext_tooltip = TextInput(value="default", title="Label:", description=plaintext_tooltip)
input_with_html_tooltip = TextInput(value="default", title="Label2:", description=html_tooltip)

show(column(input_with_plaintext_tooltip, input_with_html_tooltip))
