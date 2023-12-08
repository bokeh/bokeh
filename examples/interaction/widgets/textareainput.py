from bokeh.io import show, curdoc
from bokeh.models import CustomJS, TextAreaInput

text_area_input = TextAreaInput(value="default", rows=6, title="Label:")
text_area_input.js_on_change("value", CustomJS(code="""
    console.log('text_area_input: value=' + this.value, this.toString())
"""))

curdoc().add_root(text_area_input)
show(text_area_input)
