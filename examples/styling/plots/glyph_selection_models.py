from bokeh.models import Scatter
from bokeh.plotting import figure, show

plot = figure(width=400, height=400, tools="tap", title="Select a circle")
renderer = plot.scatter([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=50)

renderer.selection_glyph = renderer.glyph.clone(fill_alpha=1, fill_color="firebrick", line_color=None)
renderer.nonselection_glyph = renderer.glyph.clone(fill_alpha=0.2, fill_color="blue", line_color="firebrick")

show(plot)
