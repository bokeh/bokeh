''' A marker plot that demonstrates a slope.

.. bokeh-example-metadata::
    :apis: bokeh.models.Slope, bokeh.plotting.figure.scatter
    :refs: :ref:`ug_basic_annotations_slope`
    :keywords: slope

'''
import numpy as np

from bokeh.models import Slope
from bokeh.palettes import Sunset10
from bokeh.plotting import figure, show

# linear equation parameters
slope, intercept = 2, 10

x = np.arange(0, 20, 0.2)
y = slope * x + intercept + np.random.normal(0, 4, 100)

blue, yellow = Sunset10[0], Sunset10[5]

p = figure(width=600, height=600, x_axis_label='x', y_axis_label='y',
           background_fill_color="#fafafa")
p.y_range.start = 0

p.scatter(x, y, size=8, alpha=0.8, fill_color=yellow, line_color="black")

slope = Slope(gradient=slope, y_intercept=intercept,
              line_color=blue, line_dash='dashed', line_width=4)

p.add_layout(slope)

show(p)
