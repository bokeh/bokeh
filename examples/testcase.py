# Super simple
# Only +inf

from bokeh.layouts import gridplot
from bokeh.io import show
from bokeh.plotting import figure

p_test_1a = figure(y_axis_type='log', title="screen_min")
p_test_1a.vbar(
    x=[1, 2, 3], 
    top=[1, 10, 100], 
    width=0.9,
    inf="screen_min",
)

p_test_1b = figure(y_axis_type='log', title="screen_max")
vbar = p_test_1b.vbar(
    x=[1, 2, 3], 
    top=[1, 10, 100], 
    width=0.9,
    inf="screen_max",
)

p_test_2 = figure(y_axis_type='log', title="none")
vbar = p_test_2.vbar(
    x=[1, 2, 3], 
    top=[1, 10, 100], 
    width=0.9,
    inf=None,
)

p_test_inf = figure(y_axis_type='log', title="infinity circle")
p_test_inf.circle(x=[1, 2, 3, 4], y=[0, 1, 0, 2])

show(
    gridplot([p_test_1a, p_test_1b, p_test_2, p_test_inf], ncols=2)
)

