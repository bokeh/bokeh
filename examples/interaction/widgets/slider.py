from bokeh.io import show
from bokeh.models import CustomJS, Slider

slider = Slider(start=0, end=10, value=1, step=.1, title="Stuff")
slider.js_on_change("value", CustomJS(code="""
    console.log('slider: value=' + this.value, this.toString())
"""))

show(slider)
