# https://github.com/bokeh/bokeh/issues/8766

# Bokeh imports
from bokeh.layouts import gridplot
from bokeh.plotting import figure


def fig():
    plot = figure(tools=["pan", "box_select"], active_drag="box_select", width=300, height=300)
    plot.scatter(x=[0, 1, 2], y=[0, 1, 2], size=10, fill_color=["red", "green", "blue"])
    return plot

fig0 = fig()
fig1 = fig()
fig2 = fig()

gp = gridplot([[fig0], [fig1], [fig2]], merge_tools=True)
output = gp
