import math

from bokeh.models import Ellipse, GraphDataSource, GraphRenderer, StaticLayoutProvider
from bokeh.palettes import Spectral8
from bokeh.plotting import figure, show

N = 8
node_indices = list(range(N))

plot = figure(title='Graph layout demonstration', x_range=(-1.1,1.1), y_range=(-1.1,1.1),
              tools='', toolbar_location=None)

graph_source = GraphDataSource(
    nodes=[{"id": index, "color": color} for index, color in zip(node_indices, Spectral8)],
    edges=[(0, index) for index in node_indices],
)
graph = GraphRenderer(data_source=graph_source)

graph.node_renderer.glyph = Ellipse(height=0.1, width=0.2, fill_color='color')

circ = [i*2*math.pi/8 for i in node_indices]
x = [math.cos(i) for i in circ]
y = [math.sin(i) for i in circ]

graph_layout = dict(zip(node_indices, zip(x, y)))
graph.layout_provider = StaticLayoutProvider(graph_layout=graph_layout)

plot.renderers.append(graph)

show(plot)
