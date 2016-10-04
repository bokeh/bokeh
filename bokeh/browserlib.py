from bokeh.util.deprecation import deprecated
deprecated((0, 11, 0), 'bokeh.browserlib', 'bokeh.util.browser')
del deprecated

from .util.browser import * # NOQA
