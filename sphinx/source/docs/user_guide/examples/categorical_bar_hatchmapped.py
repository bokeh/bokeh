from bokeh.io import show, output_file
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure

output_file("hatchmapped_bars.html")

fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
counts = [5, 3, 4, 2, 4, 6]
patterns = ['dot', 'horizontal_wave', 'left_diagonal_line', 'cross', 'ring', 'blank']

source = ColumnDataSource(data=dict(fruits=fruits, counts=counts))

p = figure(x_range=fruits, plot_height=250, toolbar_location=None, title="Fruit Counts")
p.vbar(x='fruits', top='counts', width=0.9, source=source, legend="fruits",
       color='#efefef', hatch_scale=8, hatch_weight=0.5,
       hatch_alpha=0.8, hatch_pattern=factor_hatch('fruits', patterns=patterns, factors=fruits))

p.xgrid.grid_line_color = None
p.y_range.start = 0
p.y_range.end = 9
p.legend.orientation = "horizontal"
p.legend.location = "top_center"
p.legend.glyph_width = p.legend.glyph_height = 30

show(p)
