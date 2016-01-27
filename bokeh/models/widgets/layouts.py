
from bokeh.util.deprecate import deprecated_module
deprecated_module(
    'bokeh.models.widgets.layouts',
    '0.11.1',
    'use bokeh.models.layouts instead')
del deprecated_module

from ..layouts import * # NOQA
