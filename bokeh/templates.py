
from bokeh.util.deprecate import deprecated_module
deprecated_module('bokeh.templates', '0.11', 'use bokeh.core.templates instead')
del deprecated_module

from .core.templates import * # NOQA