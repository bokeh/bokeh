
from bokeh.util.deprecate import deprecated_module
deprecated_module('bokeh.browserlib', '0.11', 'use bokeh.util.browser instead')
del deprecated_module

from .util.browser import * # NOQA