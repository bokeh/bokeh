from bokeh.plotting import figure, show
from bokeh.sampledata.cycling import cycling

# create a new plot with a timedelta axis type
p = figure(width=800, height=250, x_axis_type="timedelta", y_axis_label='Power [W]')

p.line(cycling['time'], cycling['power'], color='green')

show(p)
