# https://github.com/bokeh/bokeh/issues/11694

from bokeh.models import XYPlot

plot = XYPlot(tags=[dict(id="1000")])
output = plot
