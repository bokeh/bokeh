
from bokeh.util.deprecate import deprecated_module
deprecated_module('bokeh.mixins', '0.11', 'use bokeh.core.property_mixins instead')
del deprecated_module

from .core.property_mixins import * # NOQA