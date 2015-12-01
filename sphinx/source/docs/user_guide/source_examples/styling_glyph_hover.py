from bokeh.plotting import figure, output_file, show
from bokeh.models import ColumnDataSource, Circle, HoverTool
from bokeh.sampledata.glucose import data

output_file("styling_hover.html")

subset = data.ix['2010-10-06']

x, y = subset.index.to_series(), subset['glucose']

# Basic plot setup
plot = figure(width=600, height=300, x_axis_type="datetime", tools="",
              toolbar_location=None, title='Hover over points')
plot.line(x, y, line_dash="4 4", line_width=1, color='gray')

cr = plot.circle(x, y, fill_color="grey", fill_alpha=0.05, line_color=None, size=20, hover_fill_color="firebrick", hover_alpha=0.3, hover_line_color="white")

plot.add_tools(HoverTool(tooltips=None, renderers=[cr], mode='hline'))

show(plot)