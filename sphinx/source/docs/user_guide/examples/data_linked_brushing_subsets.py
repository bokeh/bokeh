from bokeh.plotting import figure, output_file, show
from bokeh.layouts import gridplot
from bokeh.models import ColumnDataSource, CDSView, BooleanFilter

output_file("linked_selection_subsets.html")

x = list(range(-20, 21))
y0 = [abs(xx) for xx in x]
y1 = [xx**2 for xx in x]

# create a column data source for the plots to share
source = ColumnDataSource(data=dict(x=x, y0=y0, y1=y1))

# create a view of the source for one plot to use
view = CDSView(source=source, filters=[BooleanFilter([True if y > 250 or y < 100 else False for y in y1])])

TOOLS = "box_select,lasso_select,hover,help"

# create a new plot and add a renderer
left = figure(tools=TOOLS, plot_width=300, plot_height=300, title=None)
left.circle('x', 'y0', size=10, hover_color="firebrick", source=source)

# create another new plot, add a renderer that uses the view of the data source
right = figure(tools=TOOLS, plot_width=300, plot_height=300, title=None)
right.circle('x', 'y1', size=10, hover_color="firebrick", source=source, view=view)

p = gridplot([[left, right]])

show(p)
