import math

from bokeh.models import ColumnDataSource, Ellipse, GraphDataSource, GraphRenderer, StaticLayoutProvider
from bokeh.palettes import Spectral8
from bokeh.plotting import figure, show

N = 8
node_indices = list(range(N))

plot = figure(title="Graph Layout Demonstration", x_range=(-1.1,1.1), y_range=(-1.1,1.1),
              tools="", toolbar_location=None)

graph_source = GraphDataSource(
    nodes=[{"id": index, "color": color} for index, color in zip(node_indices, Spectral8)],
    edges=[(0, index) for index in node_indices],
)
graph = GraphRenderer(data_source=graph_source)

graph.node_renderer.glyph = Ellipse(height=0.1, width=0.2, fill_color="color")

# create a static layout
circ = [i*2*math.pi/8 for i in node_indices]
x = [math.cos(i) for i in circ]
y = [math.sin(i) for i in circ]
graph_layout = dict(zip(node_indices, zip(x, y)))
graph.layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

# draw quadratic bezier paths
def bezier(start, end, control, steps):
    return [(1-s)**2*start + 2*(1-s)*s*control + s**2*end for s in steps]

xs, ys = [], []
sx, sy = graph_layout[0]
steps = [i/100. for i in range(100)]
for node_index in node_indices:
    ex, ey = graph_layout[node_index]
    xs.append(bezier(sx, ex, 0, steps))
    ys.append(bezier(sy, ey, 0, steps))
assert isinstance(graph_source.edges, ColumnDataSource)
graph_source.edges.data['xs'] = xs
graph_source.edges.data['ys'] = ys

plot.renderers.append(graph)

show(plot)
