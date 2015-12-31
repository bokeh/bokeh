import os

from bokeh.properties import Dict, String
from bokeh.model.widgets.layout import BaseBox
from bokeh.properties import Int, Instance, List, Component

from .helpers import load_component

class StyleableBox(BaseBox):
    __implementation__ = load_component('./styleable_box.coffee')
    css_properties = Dict(String, String, default=None)
