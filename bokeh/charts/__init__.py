from __future__ import absolute_import

from .builder.area_builder import Area; Area
from .builder.donut_builder import Donut; Donut
from .builder.dot_builder import Dot; Dot
from .builder.line_builder import Line; Line
from .builder.step_builder import Step; Step
from .builder.histogram_builder import Histogram; Histogram
from .builder.bar_builder import Bar; Bar
from .builder.scatter_builder import Scatter; Scatter
from .builder.boxplot_builder import BoxPlot; BoxPlot
from .builder.timeseries_builder import TimeSeries; TimeSeries
from .builder.heatmap_builder import HeatMap; HeatMap
from .builder.horizon_builder import Horizon; Horizon

from ._chart import Chart; Chart
from ._data_adapter import DataAdapter; DataAdapter

from ..deprecate import deprecated
from ..models import ColumnDataSource; ColumnDataSource
from ..io import (
    curdoc, cursession, output_file, output_notebook, output_server, push,
    reset_output, save, show, gridplot, vplot, hplot)

# Silence pyflakes
(curdoc, cursession, output_file, output_notebook, output_server, push,
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
