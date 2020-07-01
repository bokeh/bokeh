from bokeh.plotting import figure, show
from bokeh.models import InfoPane

plot = figure(width = 400, height = 400, x_range = (0,10), y_range = (0,10), toolbar_location = None)
plot.circle([1, 8, 3, 4, 5], [2, 4, 8, 2, 7], size = 10)

#draw Info_panes to acheive the desired task

#configure the InfoPane with data-units and position the anchor
pane1 = InfoPane(x = 8, y = 4, content = ["I signify the point selected"], anchor = "right")
#configuring the InfoPane with screen-units
pane2 = InfoPane(x = 185, y = 250, content = ["I can work as a hover"], anchor = "above", position_units = "screen")
pane3 = InfoPane(x = 0, y = 350, content = ["I mark the y-axis"], anchor = "left", position_units = "screen")
pane4 = InfoPane(x = 4, y = 0, content = ["I signify the x-axis"], anchor = "below")
#attached arrow can be removed and multiple HTML Strings passed
pane5 = InfoPane(x = 10, y = 9, content = ["I am the Info-Pane", "This is a plot"], anchor = "right", show_arrow = False)

#adding the panes to layout
plot.add_layout(pane1)
plot.add_layout(pane2)
plot.add_layout(pane3)
plot.add_layout(pane4)
plot.add_layout(pane5)

show(p)