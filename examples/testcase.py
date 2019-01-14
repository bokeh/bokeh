# Super simple
# Only +inf

from bokeh.layouts import gridplot
from bokeh.io import show
from bokeh.plotting import figure

p_good = figure(y_axis_type='log')
p_good.vbar(
    x=[1, 2, 3], 
    top=[1, 10, 100], 
    bottom=0.1,
    width=0.9,
)

p_test = figure(y_axis_type='log')
p_test.vbar(
    x=[1, 2, 3], 
    top=[1, 10, 100], 
    width=0.9,
)

show(
    gridplot([p_good, p_test], ncols=2)
)

