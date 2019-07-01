from bokeh.models import ColumnDataSource, Plot, LinearAxis, Grid
from bokeh.models.glyphs import MultiPolygons
from bokeh.io import curdoc, show

xs_dict = [
    [ {'exterior': [1, 1, 2, 2],  'holes': [                              ]} ],
    [ {'exterior': [1, 1, 3],     'holes': [ [1.5, 1.5, 2]                ]} ],
    [ {'exterior': [2, 2, 4, 4],  'holes': [ [2.5, 2.5, 3], [3.5, 3, 3]   ]},
      {'exterior': [3.5, 3.5, 4], 'holes': [                              ]} ]
]

ys_dict = [
    [ {'exterior': [4, 3, 3, 4],  'holes': [                              ]} ],
    [ {'exterior': [1, 3, 1],     'holes': [ [1.5, 2, 1.5]                ]} ],
    [ {'exterior': [2, 4, 4, 2],  'holes': [ [3, 3.5, 3.5], [2.5, 2.5, 3] ]},
      {'exterior': [1, 1.5, 1.5], 'holes': [                              ]} ]
]

xs = [[[p['exterior'], *p['holes']] for p in mp] for mp in xs_dict]
ys = [[[p['exterior'], *p['holes']] for p in mp] for mp in ys_dict]

source = ColumnDataSource(dict(xs=xs, ys=ys))

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = MultiPolygons(xs="xs", ys="ys", line_width=2)
plot.add_glyph(source, glyph)

xaxis = LinearAxis()
plot.add_layout(xaxis, 'below')

yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')

plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)

show(plot)
