# https://github.com/bokeh/bokeh/issues/13964

from bokeh.models import CustomJS, TextInput

text_input = TextInput()
custom_js = CustomJS(
    args=dict(test={"constructor": 12}),
    code="export default ({test}) => console.log(test)",
)
text_input.js_on_change("change:value", custom_js)
output = text_input
