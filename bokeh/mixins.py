from bokeh.util.deprecation import deprecated
deprecated((0, 11, 0), 'bokeh.mixins', 'bokeh.core.property_mixins')
del deprecated

from .core.property_mixins import * # NOQA
