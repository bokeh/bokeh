from bokeh.util.deprecation import deprecated
deprecated((0, 11, 0), 'bokeh.plotting_helpers', 'bokeh.plotting.helpers')
del deprecated

from .plotting.helpers import * # NOQA
