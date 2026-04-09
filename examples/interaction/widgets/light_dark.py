from bokeh import events
from bokeh.core.enums import ColorScheme
from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import CustomJS, Div, Dropdown, LightDark

color_scheme = ColorScheme.auto
curdoc().config.color_scheme = color_scheme

menu = [("Dark", ColorScheme.dark), ("Auto", ColorScheme.auto), ("Light", ColorScheme.light)]
color_scheme_dropdown = Dropdown(label="Update color scheme", menu=menu)
color_scheme_dropdown.js_on_event(events.MenuItemClick, CustomJS(code="""
    cb_obj.origin.document.config.color_scheme = cb_obj.item
"""))

light_dark = LightDark()

div = Div(text=f"Current scheme: {color_scheme}")
curdoc().config.js_on_change("color_scheme", CustomJS(args=dict(div=div), code="""
    div.text = `Current scheme: ${cb_obj.color_scheme}`
"""))

curdoc().add_root(
    row([color_scheme_dropdown, light_dark, div], stylesheets=[
        ":host { background-color: light-dark(white, black); color: light-dark(black, white);}",
    ]),
)

curdoc().config.color_scheme = color_scheme
