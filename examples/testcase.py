# Super simple
# Only +inf

from bokeh.layouts import gridplot
from bokeh.io import show
from bokeh.plotting import figure

p_test_vbar_x_a = figure(y_axis_type='log', title="screen_min")
p_test_vbar_x_a.vbar(
    x=[1, 2, 3], 
    top=[1, 10, 100], 
    width=0.9,
    inf="screen_min",
)

p_test_vbar_x_b = figure(y_axis_type='log', title="screen_max")
p_test_vbar_x_b.vbar(
    x=[1, 2, 3], 
    top=[1, 10, 100], 
    width=0.9,
    inf="screen_max",
)

p_test_vbar_x_c = figure(y_axis_type='log', title="none")
p_test_vbar_x_c.vbar(
    x=[1, 2, 3], 
    top=[1, 10, 100], 
    width=0.9,
    inf=None,
)

p_test_circle = figure(y_axis_type='log', title="infinity circle")
p_test_circle.circle(x=[1, 2, 3, 4], y=[0, 1, 0, 2], size=10)

show(
    gridplot([p_test_vbar_x_a, p_test_vbar_x_b, p_test_vbar_x_c, p_test_circle], ncols=3)
)

