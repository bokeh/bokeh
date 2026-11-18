''' Show relative context alongside datetime tick labels.

.. bokeh-example-metadata::
    :sampledata: glucose
    :title: Datetime tick context
    :keywords: datetime tick context, appearance, plots
    :apis: bokeh.plotting.figure.line
'''

from bokeh.models import RELATIVE_DATETIME_CONTEXT
from bokeh.plotting import figure, show
from bokeh.sampledata.glucose import data

x = data.loc['2010-10-06'].index.to_series()
y = data.loc['2010-10-06']['glucose']

p = figure(sizing_mode="stretch_width", x_axis_type="datetime",
           tools="xwheel_zoom")
p.xaxis.formatter.context = RELATIVE_DATETIME_CONTEXT()

p.line(x, y, line_dash="4 4", line_width=3, color='gray')

show(p)
