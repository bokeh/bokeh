from bokeh.models import InfoPane
from bokeh.plotting import figure, show

plot = figure(width = 400, height = 400, x_range = (0,10), y_range = (0,10), toolbar_location = None)
plot.circle([1, 8, 3, 4, 5], [2, 4, 8, 2, 7], size = 10)

#draw Info_panes to acheive the desired task

#configure the InfoPane with data-units and position the anchor
pane1 = InfoPane(position = [8, 4], content = "I signify the point selected", anchor = "right")
#configuring the InfoPane with screen-units
pane2 = InfoPane(position = [185, 250], content = "I can work as a hover", anchor = "above", position_units = "screen")
pane3 = InfoPane(position = [0, 350], content = "I mark the y-axis", anchor = "left", position_units = "screen")
pane4 = InfoPane(position = [4, 0], content = "I signify the x-axis", anchor = "below")
#attached arrow can be removed
pane5 = InfoPane(position = [10, 9], content = "I am the Info-Pane", anchor = "right", show_arrow = False)

#adding the panes to layout
plot.add_layout(pane1)
plot.add_layout(pane2)
plot.add_layout(pane3)
plot.add_layout(pane4)
plot.add_layout(pane5)

show(plot)
