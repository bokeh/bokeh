from __future__ import print_function

from numpy import pi, cos, sin, linspace

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.browserlib import view

from bokeh.objects import ColumnDataSource, Range1d, Plot, Glyph, Timer, LinearAxis, Grid
from bokeh.glyphs import AnnularWedge

N = 50
r_base = 8
theta = linspace(0, 2*pi, N+1)
r_x = linspace(0, 6*pi, N)
rmin = r_base - cos(r_x) - 1
rmax = r_base + sin(r_x) + 1

colors = ["FFFFCC", "#C7E9B4", "#7FCDBB", "#41B6C4", "#2C7FB8", "#253494", "#2C7FB8", "#41B6C4", "#7FCDBB", "#C7E9B4"]*5

source = ColumnDataSource(data=dict(
    rmin = rmin,
    rmax = rmax,
    theta0 = theta[:-1],
    theta1 = theta[1:],
    colors = colors,
))

xdr = Range1d(start=-11, end=11)
ydr = Range1d(start=-11, end=11)

plot = Plot(title="", data_sources=[source], x_range=xdr, y_range=ydr, width=600, height=600)

xaxis = LinearAxis(plot=plot, dimension=0)
yaxis = LinearAxis(plot=plot, dimension=1)

xgrid = Grid(plot=plot, axis=xaxis, dimension=0)
ygrid = Grid(plot=plot, axis=yaxis, dimension=1)

glyph = AnnularWedge(x=0, y=0, inner_radius="rmin", outer_radius="rmax", start_angle="theta0", end_angle="theta1", fill_color="colors", line_color="black")
renderer = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=glyph)
plot.renderers.append(renderer)

def source_updater():
    from bokeh.script import symbols, Function, Let, Set, Ref, Clone, Roll

    ds, data = symbols("ds", "data")
    callback = Function((),
        Let(ds, Ref(source)),
        Let(data, Clone(ds.get("data"))),
        Set(data["rmin"], Roll(data["rmin"], +1)),
        Set(data["rmax"], Roll(data["rmax"], -1)),
        ds.set("data", data),
        ds.save(),
    )

    return callback

timer = Timer(interval=100, callback=source_updater())

doc = Document()
doc.add(plot, timer)

if __name__ == "__main__":
    filename = "roll.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Roll Plot"))
    print("Wrote %s" % filename)
    view(filename)
