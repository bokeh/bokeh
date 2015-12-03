from bokeh.plotting import figure, output_file, show
from bokeh.models import ColumnDataSource, Circle, HoverTool
from bokeh.sampledata.glucose import data

output_file("hover_glyph.html")

x, y = data.ix['2010-10-06'].index.to_series(), data.ix['2010-10-06']['glucose']

# Basic plot setup
p = figure(width=600, height=300, x_axis_type="datetime", tools="", toolbar_location=None, title='Hover over points')
p.line(x, y, line_dash="4 4", line_width=1, color='gray')

# Add a circle, that is visible only when selected
# source = ColumnDataSource({'x': x, 'y': y})
# invisible_circle = Circle(x='x', y='y', fill_color='gray', fill_alpha=0.5, line_color="white", size=20)
# visible_circle = Circle(x='x', y='y', fill_color='firebrick', fill_alpha=0.9, line_color="blue", size=20)
# cr = p.add_glyph(source, invisible_circle, hover_glyph=visible_circle)

cr = p.circle(x, y, fill_color="grey", alpha=0.1, line_color=None, size=20,
    hover_fill_color="firebrick", hover_alpha=0.5, hover_line_color="white")

p.add_tools(HoverTool(tooltips=None, renderers=[cr], mode='hline'))

show(p)
