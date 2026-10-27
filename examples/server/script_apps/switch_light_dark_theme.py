from bokeh import events
from bokeh.core.enums import ColorScheme
from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import Div, Dropdown, LightDark


def on_dropdown_click(event):
    curdoc().config.color_scheme = event.item


def on_config_color_scheme_change(attr, old, new):
    div.text = f"Current scheme: {new}"


color_scheme = ColorScheme.auto
curdoc().config.color_scheme = color_scheme
curdoc().title = "LightDark"
curdoc().config.on_change("color_scheme", on_config_color_scheme_change)

menu = [("Dark", ColorScheme.dark), ("Auto", ColorScheme.auto), ("Light", ColorScheme.light)]
color_scheme_dropdown = Dropdown(label="Update color scheme", menu=menu)
color_scheme_dropdown.on_event(events.MenuItemClick, on_dropdown_click)

light_dark = LightDark()
div = Div(text=f"Current scheme: {color_scheme}")

curdoc().add_root(
    row([color_scheme_dropdown, light_dark, div], stylesheets=[
        ":host { background-color: light-dark(white, black); color: light-dark(black, white);}",
    ]),
)
