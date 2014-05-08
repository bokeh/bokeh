from bokeh.plotting import *
from bokeh.sampledata.autompg import autompg

output_file("panning.html")

# Load some Automobile data into a data source. Interesting columns are:
# "yr" - Year manufactured
# "mpg" - miles per gallon
# "displ" - engine displacement
# "hp" - engine horsepower
# "cyl" - number of cylinders
source = ColumnDataSource(autompg.to_dict("list"))
source.add(autompg["yr"], name="yr")

# Let's set up some plot options in a dict that we can re-use on multiple plots
plot_config = dict(plot_width=300, plot_height=300, tools="pan,wheel_zoom,box_zoom,select")

# gridplot(...) accepts nested lists of plot objects
gridplot([[

  # First let's plot the "yr" vs "mpg" using the plot config above
  # Note that we are supplying our our data source explicitly
  circle("yr", "mpg", color="blue", title="MPG by Year", source=source, **plot_config),

  # EXERCISE: add another circle renderer for "hp" vs "displ" with color "green" to this
  # list of plots. This renderer should use the same data source as the renderer above,
  # that is what will cause the plots selections to be linked
  circle("hp", "displ", color="green", title="HP vs. Displacement", source=source, **plot_config),

  # EXERCISE: add another circle renderer for "mpg" vs "displ", size proportional to "cyl"
  # Set the the line color to be "red" with no fill, and use the same data source again
  # to link selections
  circle("mpg", "displ", size="cyl", line_color="red", title="MPG vs. Displacement",
         fill_color=None, source=source, **plot_config) ]])

show()
