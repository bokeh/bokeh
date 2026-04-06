from bokeh import events
from bokeh.core.enums import ColorScheme
from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import CustomJS, Div, LightDark, Dropdown

menu = [("Dark", ColorScheme.dark), ("Auto", ColorScheme.auto), ("Light", ColorScheme.light)]
color_scheme_dropdown = Dropdown(label="Update color scheme", menu=menu)
color_scheme_dropdown.js_on_event(events.MenuItemClick, CustomJS(code="""
    cb_obj.origin.document.config.color_scheme = cb_obj.item
"""))

div = Div(text="Current scheme: Light")

light_dark = LightDark(active=True)
light_dark.js_on_change("active", CustomJS(args=dict(div=div), code="""
    const state = this.active ? "Light" : this.active != null ? "Dark" : "Auto"
    div.text = `Current scheme: ${state}`
"""))

show(
    row([color_scheme_dropdown, light_dark, div], stylesheets=[
        ":host { background-color: light-dark(white, black); color: light-dark(black, white);}",
    ]),
)
