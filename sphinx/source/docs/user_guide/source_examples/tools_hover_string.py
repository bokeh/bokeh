from bokeh.plotting import figure, output_file, show

output_file("toolbar.html")

# Add hover to this comma-separated string and see what changes
TOOLS = 'box_zoom,box_select,crosshair,resize,reset'

# create a new plot with the toolbar below
p = figure(plot_width=400, plot_height=400, title=None, tools=TOOLS)

p.circle([1, 2, 3, 4, 5], [2, 5, 8, 2, 7], size=10)
show(p)
