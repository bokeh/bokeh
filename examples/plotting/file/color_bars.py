import numpy as np

from bokeh.plotting import figure, save
from bokeh.models import (
    Range1d,
    ColorBar,
    LinearColorMapper, LogColorMapper, EqHistColorMapper,
    BasicTicker, BasicTickFormatter,
    LogTicker, LogTickFormatter,
)
from bokeh.layouts import gridplot, row, column
from bokeh.palettes import Plasma256, Magma256

np.random.seed(19680801)
Nr = 3
Nc = 2
cmap = "cool"

tooltips0 = [("x", "$x"), ("y", "$y"), ("im", "@image")]
tooltips1 = [("x", "$x"), ("y", "$y"), ("r", "@radius")]

mapper0 = LinearColorMapper(palette=Plasma256, low_color="white", high_color="black")
mapper1 = LinearColorMapper(palette=Plasma256, low_color="white", high_color="black")
mapper2 = LinearColorMapper(palette=Plasma256, low_color="white", high_color="black")

plots0 = []
for i in range(Nr):
    for j in range(Nc):
        data = ((1 + i + j) / 10) * np.random.rand(10, 20)
        x_range = Range1d(-1, 11)
        y_range = Range1d(-1, 11)
        p = figure(plot_width=200, plot_height=200, x_range=x_range, y_range=y_range, tooltips=tooltips0, tools="box_select")
        r = p.image(image=[data], x=0, y=0, dw=10, dh=10, color_mapper=mapper0)
        mapper0.domain.append((r, "image"))
        #mapper0.domain.append((r.data_source, ["image"], r.view))
        #mapper.renderers += r
        plots0.append(p)

color_bar0 = ColorBar(color_mapper=mapper0, location=(0,0), orientation='horizontal',
    padding=0, ticker=BasicTicker(), formatter=BasicTickFormatter())
plots0[-1].add_layout(color_bar0, "below")

g0 = gridplot(plots0, ncols=2)

def d1(i, j):
    N = int(100/(1 + i))
    print(N)
    x = np.random.random(size=N) * 100
    y = np.random.random(size=N) * 100
    r = 5*((1 + i + j))*np.linspace(0, 1, N) # * np.random.rand(N)
    return x, y, r

plots1 = []
for i in range(Nr):
    for j in range(Nc):
        p = figure(plot_width=200, plot_height=200, tooltips=tooltips1, tools="box_select,box_zoom,pan,wheel_zoom")
        x, y, r = d1(i, j)
        r = p.scatter(x, y, radius=r, fill_color=dict(field="radius", transform=mapper1), fill_alpha=0.6, line_color=None)
        mapper1.domain.append((r, "radius"))
        #mapper1.domain.append((r.data_source, ["radius"], r.view))
        #mapper1.add_domain(r.data_source.fields.radius) # BoundField
        plots1.append(p)

color_bar1 = ColorBar(color_mapper=mapper1, location=(0,0), orientation='horizontal',
    padding=0, ticker=BasicTicker(), formatter=BasicTickFormatter())
plots1[-1].add_layout(color_bar1, "below")

g1 = gridplot(plots1, ncols=2)

def d2():
    N = 500
    x = np.random.random(size=N)
    y = np.random.random(size=N)
    r = 2*(x + y)*np.linspace(0, 1, N)
    return x*100, y*100, r

p2 = figure(plot_width=500, plot_height=500, tooltips=tooltips1, tools="box_select,box_zoom,pan,wheel_zoom")
x2, y2, r2 = d2()
gr2 = p2.scatter(x2, y2, radius=r2, fill_color=dict(field="radius", transform=mapper2), fill_alpha=0.6, line_color=None)
mapper2.domain.append((gr2, "radius"))

def d2c(c=1):
    N = 500
    x = np.random.random(size=N)
    y = np.random.random(size=N)
    r = c*np.linspace(0, 1, N)
    return x*100, y*100, r

p21 = figure(plot_width=500, plot_height=500, tooltips=tooltips1, tools="pan,box_select,box_zoom,wheel_zoom")
x21, y21, r21 = d2c(0.8)
gr21 = p21.scatter(x21, y21, radius=r21, fill_color=dict(field="radius", transform=mapper2), fill_alpha=0.6, line_color=None)
mapper2.domain.append((gr21, "radius"))

p22 = figure(plot_width=500, plot_height=500, tooltips=tooltips1, tools="pan,box_select,box_zoom,wheel_zoom")
x22, y22, r22 = d2c(1.0)
gr22 = p22.scatter(x22, y22, radius=r22, fill_color=dict(field="radius", transform=mapper2), fill_alpha=0.6, line_color=None)
mapper2.domain.append((gr22, "radius"))

p23 = figure(plot_width=500, plot_height=500, tooltips=tooltips1, tools="pan,box_select,box_zoom,wheel_zoom")
x23, y23, r23 = d2c(1.2)
gr23 = p23.scatter(x23, y23, radius=r23, fill_color=dict(field="radius", transform=mapper2), fill_alpha=0.6, line_color=None)
mapper2.domain.append((gr23, "radius"))

color_bar2 = ColorBar(color_mapper=mapper2, location=(0,0), orientation='horizontal', padding=0, ticker=BasicTicker(), formatter=BasicTickFormatter())
p21.add_layout(color_bar2, "below")

#r = column(row([g0, g1]), p2)
#save(r)

#root0 = row([g0, g1])
root1 = gridplot([[p21, p22], [p23, p2]])

#save([root0, root1])
save(root1)
