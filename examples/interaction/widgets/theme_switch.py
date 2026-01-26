from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import CustomJS, Div, ThemeSwitch

theme_switch = ThemeSwitch(active=True)
div = Div(text="Current state: Light")
theme_switch.js_on_change("active", CustomJS(args=dict(div=div), code="""
    const state = this.active ? "Light" : "Dark"
    div.text = `Current state: ${state}`
"""))
show(
    row([theme_switch, div], stylesheets=[
        ":host { background-color: light-dark(white, black); color: light-dark(black, white);}",
    ]),
)
