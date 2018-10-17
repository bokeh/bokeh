from bokeh.models import HoverTool
from bokeh.plotting import figure, output_file, show
from bokeh.sampledata.glucose import data

x = data.loc['2010-10-06'].index.to_series()
y = data.loc['2010-10-06']['glucose']

# Basic plot setup
p = figure(plot_width=800, plot_height=400, x_axis_type="datetime",
           tools="", toolbar_location=None, title='Hover over points')
p.ygrid.grid_line_color = None
p.background_fill_color = "#fafafa"

p.line(x, y, line_dash="4 4", line_width=1, color='gray')

cr = p.circle(x, y, size=20,
              fill_color="steelblue", alpha=0.1, line_color=None,
              hover_fill_color="midnightblue", hover_alpha=0.5,
              hover_line_color="white")

p.add_tools(HoverTool(tooltips=None, renderers=[cr], mode='hline'))

output_file("hover_glyph.html", title="hover_glyph.py example")

show(p)
