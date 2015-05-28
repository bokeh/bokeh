from bokeh.plotting import ColumnDataSource, figure, gridplot, output_file, show
from bokeh.sampledata.autompg import autompg

output_file("brushing.html")

# Load some Automobile data into a data source. Interesting columns are:
# "yr" - Year manufactured
# "mpg" - miles per gallon
# "displ" - engine displacement
# "hp" - engine horsepower
# "cyl" - number of cylinders
source = ColumnDataSource(autompg.to_dict("list"))
source.add(autompg["yr"], name="yr")

# define some tools to add
TOOLS = "pan,wheel_zoom,box_zoom,box_select,lasso_select"

# Let's set up some plot options in a dict that we can re-use on multiple plots
plot_config = dict(plot_width=300, plot_height=300, tools=TOOLS)

# First let's plot the "yr" vs "mpg" using the plot config above
# Note that we are supplying our our data source to the renderer explicitly
p1 = figure(title="MPG by Year", **plot_config)
p1.circle("yr", "mpg", color="blue", source=source)

# EXERCISE: make another figure p2 with circle renderer, for "hp" vs "displ" with
# color "green". This renderer should use the same data source as the renderer
# above, that is what will cause the plots selections to be linked

# EXERCISE: and another figure p3 with circle renderer for "mpg" vs "displ",
# with the size proportional to "cyl". Set the the line color to be "red"
# with no fill, and use the same data source again to link selections

# gridplot(...) accepts nested lists of plot objects
p = gridplot([[p1, p2, p3]])

show(p)
