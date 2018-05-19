from bokeh.core.properties import value
from bokeh.io import show, output_file
from bokeh.models import HoverTool
from bokeh.plotting import figure

output_file("bar_stacked.html")

fruits = ['Apples', 'Pears', 'Nectarines', 'Plums', 'Grapes', 'Strawberries']
years = ["2015", "2016", "2017"]
colors = ["#c9d9d3", "#718dbf", "#e84d60"]

data = {'fruits' : fruits,
        '2015'   : [2, 1, 4, 3, 2, 4],
        '2016'   : [5, 3, 4, 2, 4, 6],
        '2017'   : [3, 2, 4, 4, 5, 3]}

p = figure(x_range=fruits, plot_height=350, title="Fruit Counts by Year",
           toolbar_location=None, tools="")

renderers = p.vbar_stack(years, x='fruits', width=0.9, color=colors, source=data,
                         legend=[value(x) for x in years])

for r in renderers:
    year = r.name
    hover = HoverTool(tooltips=[
        ("%s total" % year, "@%s" % year),
        ("index", "$index")
    ], renderers=[r])
    p.add_tools(hover)

p.y_range.start = 0
p.x_range.range_padding = 0.1
p.xgrid.grid_line_color = None
p.axis.minor_tick_line_color = None
p.outline_line_color = None
p.legend.location = "top_left"
p.legend.orientation = "horizontal"

show(p)
