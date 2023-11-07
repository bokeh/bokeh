# This is a Bokeh server app. To function, it must be run using the
# Bokeh server ath the command line:
#
#     bokeh serve --show patch_app.py
#
# Running "python patch_app.py" will NOT work.
import numpy as np

from bokeh.io import curdoc
from bokeh.layouts import gridplot
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure

# CDS with "typical" scalar elements
x = np.random.uniform(10, size=500)
y = np.random.uniform(10, size=500)
color = ["navy"]*500
color[:200] = ["firebrick"]*200
source = ColumnDataSource(data=dict(x=x, y=y, color=color))

p = figure(width=400, height=400)
p.scatter('x', 'y', alpha=0.6, size=8, color="color", source=source)

# CDS with 1d array elements
x = np.linspace(0, 10, 200)
y0 = np.sin(x)
y1 = np.cos(x)
source1d = ColumnDataSource(data=dict(xs=[x, x], ys=[y0, y1], color=["olive", "navy"]))

p1d = figure(width=400, height=400)
p1d.multi_line('xs', 'ys', alpha=0.6, line_width=4, color="color", source=source1d)

# CDS with 2d image elements
N = 200
img = np.empty((N,N), dtype=np.uint32)
view = img.view(dtype=np.uint8).reshape((N, N, 4))
for i in range(N):
    for j in range(N):
        view[i, j, :] = [int(j/N*255), int(i/N*255), 158, 255]
source2d = ColumnDataSource(data=dict(img=[img]))

p2d = figure(width=400, height=400, x_range=(0,10), y_range=(0,10))
p2d.image_rgba(image='img', x=0, y=0, dw=10, dh=10, source=source2d)

def update():

    # update some items in the "typical" CDS column
    s = slice(100)
    new_x = source.data['x'][s] + np.random.uniform(-0.1, 0.1, size=100)
    new_y = source.data['y'][s] + np.random.uniform(-0.2, 0.2, size=100)
    source.patch({ 'x' : [(s, new_x)], 'y' : [(s, new_y)] })

    # update a single point of the 1d multi-line data
    i = np.random.randint(200)
    new_y = source1d.data['ys'][0][i] + (0.2 * np.random.random()-0.1)
    source1d.patch({ 'ys' : [([0, i], [new_y])]})

    # update five rows of the 2d image data at a time
    s1, s2 = slice(50, 151, 20), slice(None)
    index = [0, s1, s2]
    new_data = np.roll(source2d.data['img'][0][s1, s2], 2, axis=1).flatten()
    source2d.patch({ 'img' : [(index, new_data)] })

curdoc().add_periodic_callback(update, 50)

curdoc().add_root(gridplot([[p, p1d, p2d]]))
