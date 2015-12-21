
from bokeh.util.deprecate import deprecated_module
deprecated_module('bokeh.properties', '0.11', 'use bokeh.core.properties instead')
del deprecated_module

from .core.properties import * # NOQA