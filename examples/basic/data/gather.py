from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.transform import gather

vertices = ColumnDataSource(dict(x=[0, 1, 1, 0, 0.5], y=[0, 0, 1, 1, 0.5]))
cells = ColumnDataSource(dict(vertex_indices=[[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]]))

p = figure(title="Four triangles drawn from a pool of five vertices", match_aspect=True)
p.patches(xs=gather(vertices, "x", indices="vertex_indices"),
          ys=gather(vertices, "y", indices="vertex_indices"), source=cells,
          fill_color="steelblue", fill_alpha=0.4)
p.scatter(x="x", y="y", source=vertices, size=10, color="navy")
show(p)
