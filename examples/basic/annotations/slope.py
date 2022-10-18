import numpy as np

from bokeh.models import Slope
from bokeh.plotting import figure, show

# linear equation parameters
slope, intercept = 2, 10

xpts = np.arange(0, 20, 0.2)
ypts = slope * xpts + intercept + np.random.normal(0, 4, 100)

p = figure(width=450, height=450, x_axis_label='x', y_axis_label='y',
           background_fill_color="#fafafa")
p.y_range.start = 0

p.circle(xpts, ypts, size=6, alpha=0.6, fill_color=None)

slope = Slope(gradient=slope, y_intercept=intercept,
              line_color='orange', line_dash='dashed', line_width=4)

p.add_layout(slope)

show(p)
