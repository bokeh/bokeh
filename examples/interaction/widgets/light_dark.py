from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import CustomJS, Div, LightDark

light_dark = LightDark(active=True)
div = Div(text="Current state: Light")
light_dark.js_on_change("active", CustomJS(args=dict(div=div), code="""
    const state = this.active ? "Light" : "Dark"
    div.text = `Current state: ${state}`
"""))
show(
    row([light_dark, div], stylesheets=[
        ":host { background-color: light-dark(white, black); color: light-dark(black, white);}",
    ]),
)
