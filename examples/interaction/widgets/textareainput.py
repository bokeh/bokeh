from bokeh.io import show
from bokeh.models import CustomJS, TextAreaInput

text_area_input = TextAreaInput(value="default", rows=6, title="Label:")
text_area_input.js_on_change("value", CustomJS(code="""
    console.log('text_area_input: value=' + this.value, this.toString())
"""))

show(text_area_input)
