
from bokeh.util.deprecate import deprecated_module
deprecated_module('bokeh.plotting_helpers', '0.11', 'use bokeh.plotting.helpers instead')
del deprecated_module

from .plotting.helpers import * # NOQA
