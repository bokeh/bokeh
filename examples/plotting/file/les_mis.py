import json
import numpy as np
from bokeh.plotting import *
from bokeh.objects import HoverTool, ColumnDataSource
from bokeh.sampledata.les_mis import data
from collections import OrderedDict

nodes = data['nodes']
names = [node['name'] for node in sorted(data['nodes'], key=lambda x: x['group'])]

N = len(nodes)
counts = np.zeros((N, N))
for link in data['links']:
    counts[link['source'], link['target']] = link['value']
    counts[link['target'], link['source']] = link['value']

colormap = [
    "#444444", "#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99",
    "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a"
]

xname = []
yname = []
color = []
alpha = []
for i, n1 in enumerate(nodes):
    for j, n2 in enumerate(nodes):
        xname.append(n1['name'])
        yname.append(n2['name'])

        a = min(counts[i,j]/4.0, 0.9) + 0.1
        alpha.append(a)

        if n1['group'] == n2['group']:
            color.append(colormap[n1['group']])
        else:
            color.append('lightgrey')

output_file("les_mis.html")

source = ColumnDataSource(
    data=dict(
        xname=xname,
        yname=yname,
        colors=color,
        alphas=alpha,
        count=counts.flatten(),
    )
)

figure()

rect('xname', 'yname', 0.9, 0.9, source=source,
     x_range=list(reversed(names)), y_range=names,
     x_axis_location="above",
     color='colors', alpha='alphas', line_color=None,
     tools="resize,hover,previewsave", title="Les Mis Occurrences (one at a time)",
     plot_width=800, plot_height=800)

grid().grid_color = None
axis().axis_color = None
axis().major_tick_color = None
axis().major_label_font_size = "5pt"
axis().major_label_standoff = 0
xaxis().major_label_orientation = np.pi/3

hover = curplot().select(dict(type=HoverTool))
hover.tooltips = OrderedDict([
    ('names', '@yname, @xname'),
    ('count', '@count'),
])

show()      # show the plot
