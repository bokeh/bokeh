# https://github.com/bokeh/bokeh/issues/11694

# Bokeh imports
from bokeh.models import Plot

plot = Plot(width=200, height=200, tags=[dict(id="1000")])
output = plot
