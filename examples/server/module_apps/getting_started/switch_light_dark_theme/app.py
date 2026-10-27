"""Switch the document between light and dark themes."""

from bokeh import events
from bokeh.core.enums import ColorScheme
from bokeh.layouts import row
from bokeh.models import Div, Dropdown, LightDark
from bokeh.server.asgi import BokehASGI


def modify_document(doc):
    def on_dropdown_click(event):
        doc.config.color_scheme = event.item

    def on_config_color_scheme_change(attr, old, new):
        div.text = f"Current scheme: {new}"

    color_scheme = ColorScheme.auto
    doc.config.color_scheme = color_scheme
    doc.title = "LightDark"
    doc.config.on_change("color_scheme", on_config_color_scheme_change)
    menu = [("Dark", ColorScheme.dark), ("Auto", ColorScheme.auto), ("Light", ColorScheme.light)]
    color_scheme_dropdown = Dropdown(label="Update color scheme", menu=menu)
    color_scheme_dropdown.on_event(events.MenuItemClick, on_dropdown_click)
    light_dark = LightDark()
    div = Div(text=f"Current scheme: {color_scheme}")
    doc.add_root(
        row([color_scheme_dropdown, light_dark, div], stylesheets=[
            ":host { background-color: light-dark(white, black); color: light-dark(black, white);}",
        ]),
    )


app = BokehASGI(modify_document)
