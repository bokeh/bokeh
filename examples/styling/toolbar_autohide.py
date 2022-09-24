from bokeh.plotting import figure, output_file, show

output_file("styling_toolbar_autohide.html")

# Basic plot setup
plot = figure(width=400, height=400, title='Toolbar Autohide')
plot.line([1,2,3,4,5], [2,5,8,2,7])

# Set autohide to true to only show the toolbar when mouse is over plot
plot.toolbar.autohide = True

show(plot)
