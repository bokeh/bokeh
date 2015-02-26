from __future__ import absolute_import

from .builder.area_builder import Area  # noqa
from .builder.donut_builder import Donut  # noqa
from .builder.dot_builder import Dot  # noqa
from .builder.line_builder import Line  # noqa
from .builder.step_builder import Step  # noqa
from .builder.histogram_builder import Histogram  # noqa
from .builder.bar_builder import Bar  # noqa
from .builder.scatter_builder import Scatter  # noqa
from .builder.boxplot_builder import BoxPlot  # noqa
from .builder.timeseries_builder import TimeSeries  # noqa
from .builder.heatmap_builder import HeatMap  # noqa
from .builder.horizon_builder import Horizon  # noqa

from ._chart import Chart
from ._data_adapter import DataAdapter

from ..deprecate import deprecated
from ..models import ColumnDataSource
from ..io import (
    curdoc, cursession, output_file, output_notebook, output_server, push,
    reset_output, save, show, gridplot, vplot, hplot)

@deprecated("Bokeh 0.8.2", "bokeh.charts.vplot function")
def VBox(*args, **kwargs):
    ''' Generate a layout that arranges several subplots vertically.
    '''

    return vplot(*args, **kwargs)

@deprecated("Bokeh 0.8.2", "bokeh.charts.hplot function")
def HBox(*args, **kwargs):
    ''' Generate a layout that arranges several subplots horizontally.
    '''

    return hplot(*args, **kwargs)
