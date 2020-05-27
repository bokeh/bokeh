import numpy as np

from bokeh.io import show
from bokeh.layouts import column, gridplot
from bokeh.models import ColorBar, ColumnDataSource, LinearColorMapper, LogColorMapper
from bokeh.plotting import figure
from bokeh.transform import transform

x = np.random.random(size=2000) * 1000
y = np.random.normal(size=2000) * 2 + 5
source = ColumnDataSource(dict(x=x, y=y))

def make_plot(mapper_type, palette):
    mapper_opts = dict(palette=palette, low=1, high=1000)
    if mapper_type == "linear":
        mapper = LinearColorMapper(**mapper_opts)
    else:
        mapper = LogColorMapper(**mapper_opts)

    p = figure(toolbar_location=None, tools='', title="", x_axis_type=mapper_type, x_range=(1, 1000))
    p.title.text = f"{palette} with {mapper_type} mapping"
    p.circle(x='x', y='y', alpha=0.8, source=source, size=6,
             fill_color=transform('x', mapper), line_color=None)

    color_bar = ColorBar(color_mapper=mapper, ticker=p.xaxis.ticker, formatter=p.xaxis.formatter,
                         location=(0,0), orientation='horizontal', padding=0)

    p.add_layout(color_bar, 'below')
    return p

p1 = make_plot('linear', 'Viridis256')
p2 = make_plot('log', 'Viridis256')
p3 = make_plot('linear', 'Viridis6')
p4 = make_plot('log', 'Viridis6')

p5 = figure(toolbar_location=None, tools='', title="", x_range=(1, 1000), plot_width=800, plot_height=300)
p5.title.text = "Viridis256 with linear mapping and low/high = 200/800 = pink/grey"
mapper = LinearColorMapper(palette="Viridis256", low=200, high=800, low_color="pink", high_color="darkgrey")
p5.circle(x='x', y='y', alpha=0.8, source=source, size=6,
         fill_color=transform('x', mapper), line_color=None)

show(column(
    gridplot([p1, p2, p3, p4], ncols=2, plot_width=400, plot_height=300, toolbar_location=None),
    p5
))
