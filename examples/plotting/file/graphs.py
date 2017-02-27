import networkx as nx
from sympy import Symbol, symbols, Dummy, roots, solve

from bokeh.plotting import figure, gridplot, GridSpec, output_file, show

def graph_draw(g, layout=nx.circular_layout, node_color="white", text_color="black"):
    pos = layout(g)
    labels = [ str(v) for v in g.nodes() ]
    vx, vy = zip(*[ pos[v] for v in g.nodes() ])
    xs, ys = [], []
    for (a, b) in g.edges():
        x0, y0 = pos[a]
        x1, y1 = pos[b]
        xs.append([x0, x1])
        ys.append([y0, y1])
    f = figure(plot_width=300, plot_height=300,
               x_axis_type=None, y_axis_type=None,
               outline_line_color=None,
               tools=[], toolbar_location=None)
    f.multi_line(xs, ys, line_color="black")
    f.circle(vx, vy, size=16, line_color="black", fill_color=node_color)
    f.text(vx, vy, text=labels, text_color=text_color,
           text_font_size="10px", text_align="center", text_baseline="middle")
    return f

V = range(1, 12+1)
E = [(1,2),(2,3),(1,4),(1,6),(1,12),(2,5),(2,7),(3,8),(3,10),(4,11),(4,9),(5,6),
     (6,7),(7,8),(8,9),(9,10),(10,11),(11,12),(5,12),(5,9),(6,10),(7,11),(8,12)]

g = nx.Graph()
g.add_nodes_from(V)
g.add_edges_from(E)

Vx = [ Symbol('x%d' % i) for i in V ]
Ex = [ (Vx[i-1], Vx[j-1]) for i, j in E ]
F3 = [ xi**3 - 1 for xi in Vx ]
Fg = [ xi**2 + xi*xj + xj**2 for xi, xj in Ex ]
Fx = F3 + Fg

colors = symbols('red,green,blue')
roots_of_unity = roots(Dummy()**3 - 1, multiple=True)
color_map = dict(zip(roots_of_unity, colors))
solutions = solve(Fx, *Vx)
colorings = [ [ color_map.get(zeta) for zeta in solution ] for solution in solutions ]

n, ncols = len(colorings), 2
gs = GridSpec((n + 1)//ncols, 1 + ncols)
gs[0, 0] = graph_draw(g)

for i, coloring in enumerate(colorings):
    f = graph_draw(g, node_color=[ str(color) for color in coloring ], text_color="white")
    gs[i//ncols, 1 + i%ncols] = f
plot = gridplot(gs, toolbar_location=None)

output_file("graphs.html", title="Graph k-coloring with computer algebra")
show(plot)
