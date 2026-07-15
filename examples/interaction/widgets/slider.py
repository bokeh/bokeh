from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import CustomJS, Slider
from bokeh.models.widgets import Div

output = Div(text="Slide to reveal the value")
slider = Slider(start=0, end=10, value=1, step=0.1, title=None)

callback = CustomJS(
    args=dict(slider=slider, output=output),
    code="""
        output.text = `Slider was updated to <b>${{ slider.value }}</b> value`
    """,
)
slider.js_on_change("value", callback)

show(row([slider, output]))
