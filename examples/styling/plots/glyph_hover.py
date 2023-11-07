from bokeh.models import RELATIVE_DATETIME_CONTEXT, HoverTool
from bokeh.plotting import figure, show
from bokeh.sampledata.glucose import data

x = data.loc['2010-10-06'].index.to_series()
y = data.loc['2010-10-06']['glucose']

# Basic plot setup
p = figure(width=800, height=400, x_axis_type="datetime",
           tools="pan,wheel_zoom", title='Hover over points')
p.xaxis.formatter.context = RELATIVE_DATETIME_CONTEXT()
p.ygrid.grid_line_color = None
p.background_fill_color = "#fafafa"

p.line(x, y, line_dash="4 4", line_width=1, color='gray')

cr = p.scatter(
    x, y, size=20,
    fill_color="steelblue", alpha=0.1, line_color=None,
    hover_fill_color="midnightblue", hover_alpha=0.5,
    hover_line_color="white",
)

p.add_tools(HoverTool(tooltips=None, renderers=[cr], mode='hline'))

show(p)
