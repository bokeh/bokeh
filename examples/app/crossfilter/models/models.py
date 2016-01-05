import os

from bokeh.properties import Dict, String, Any
from bokeh.models.widgets.layouts import BaseBox
from bokeh.properties import Int, Instance, List

from examples.app.crossfilter.models.helpers import load_component

class StyleableBox(BaseBox):
    __implementation__ = load_component('./styleable_box.coffee')
    css_properties = Dict(String, Any, default=None)
    orientation = String(default='vertical')

class StatsBox(BaseBox):
    __implementation__ = load_component('./stats_box.coffee')
    display_items = Dict(String, Any, default=None)
