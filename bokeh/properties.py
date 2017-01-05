from bokeh.util.deprecation import deprecated
deprecated((0, 11, 0), 'bokeh.properties', 'bokeh.core.properties')
del deprecated

from .core.properties import * # NOQA
