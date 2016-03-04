from bokeh.properties import Dict, String, Any
from bokeh.models.layouts import BaseBox
from bokeh.core import validation
from bokeh.core.validation.warnings import EMPTY_LAYOUT

from .helpers import load_component

class StyleableBox(BaseBox):
    '''
    styleable box provides element level css_properties as a dictionary
    '''
    __implementation__ = load_component('./styleable_box.coffee')
    css_properties = Dict(String, Any, default=None)
    orientation = String(default='vertical')

class StatsBox(BaseBox):
    __implementation__ = load_component('./stats_box.coffee')
    styles = String(default=None)
    display_items = Dict(String, Any, default=None)

    @validation.warning(EMPTY_LAYOUT)
    def _check_empty_layout(self):
        pass
