from __future__ import absolute_import

DEFAULT_PALETTE = ["#f22c40", "#5ab738", "#407ee7", "#df5320", "#00ad9c", "#c33ff3"]

from ._chart_options import ChartOptions
from ._chart_options import default_options as defaults

from .builder.area_builder import Area
from .builder.donut_builder import Donut
from .builder.dot_builder import Dot
from .builder.line_builder import Line
from .builder.step_builder import Step
from .builder.histogram_builder import Histogram
from .builder.bar_builder import Bar
from .builder.scatter_builder import Scatter
from .builder.boxplot_builder import BoxPlot
from .builder.timeseries_builder import TimeSeries
from .builder.heatmap_builder import HeatMap
from .builder.horizon_builder import Horizon

from ._chart import Chart
from ._data_source import ChartDataSource
from ._attributes import AttrSpec, color

from ..deprecate import deprecated
from ..models import ColumnDataSource
from ..io import (
    curdoc, cursession, output_file, output_notebook, output_server, push,
    reset_output, save, show, gridplot, vplot, hplot)

# Silence pyflakes
(curdoc, cursession, output_file, output_notebook, output_server, push,
 reset_output, save, show, gridplot, vplot, hplot, ColumnDataSource)


@deprecated("Bokeh 0.8.2", "bokeh.charts.vplot function")
def VBox(*args, **kwargs):
    """ Generate a layout that arranges several subplots vertically.
    """

    return vplot(*args, **kwargs)


@deprecated("Bokeh 0.8.2", "bokeh.charts.hplot function")
def HBox(*args, **kwargs):
    """ Generate a layout that arranges several subplots horizontally.
    """

    return hplot(*args, **kwargs)
