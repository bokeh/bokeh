from bokeh.util.deprecation import deprecated
deprecated((0, 11, 0), 'bokeh.templates', 'bokeh.core.templates')
del deprecated

from .core.templates import * # NOQA
