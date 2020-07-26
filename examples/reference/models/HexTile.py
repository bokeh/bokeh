from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, Grid, HexTile, LinearAxis, Plot

source = ColumnDataSource(dict(
        q=[0,  0, -1, -1,  1, 1, 0],
        r=[0, -1,  0,  1, -1, 0, 1],
    )
)

plot = Plot(
    title=None, plot_width=300, plot_height=300,
    min_border=0, toolbar_location=None)

glyph = HexTile(q="q", r="r", size=1, fill_color="#fb9a99", line_color="white")
plot.add_glyph(source, glyph)

x_axis = LinearAxis()
plot.add_layout(x_axis, 'below')

y_axis = LinearAxis()
plot.add_layout(y_axis, 'left')

plot.add_layout(Grid(dimension=0, ticker=x_axis.ticker))
plot.add_layout(Grid(dimension=1, ticker=y_axis.ticker))

curdoc().add_root(plot)

show(plot)
