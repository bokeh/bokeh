from bokeh.io import curdoc, show
from bokeh.models import GeometryDataSource, Grid, LinearAxis, Plot, Polygons

source = GeometryDataSource([
    {
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [[-2, -1], [2, -1], [2, 2], [-2, 2], [-2, -1]],
                [[-0.6, 0], [0.6, 0], [0.6, 1], [-0.6, 1], [-0.6, 0]],
            ],
        },
        "color": "#fb9a99",
    },
])

plot = Plot(title=None, width=300, height=300, min_border=0, toolbar_location=None)
plot.add_glyph(source, Polygons(fill_color="color"))

xaxis = LinearAxis()
plot.add_layout(xaxis, "below")
yaxis = LinearAxis()
plot.add_layout(yaxis, "left")
plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

curdoc().add_root(plot)
show(plot)
