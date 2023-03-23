''' A marker plot that demonstrates a slope.

.. bokeh-example-metadata::
    :apis: bokeh.models.slope, bokeh.plotting.figure.circle
    :refs: :ref:`ug_basic_annotations_slope`
    :keywords: slope

'''
import numpy as np

from bokeh.models import Slope
from bokeh.plotting import figure, show
from bokeh.palettes import Sunset10

# linear equation parameters
slope, intercept = 2, 10

xpts = np.arange(0, 20, 0.2)
ypts = slope * xpts + intercept + np.random.normal(0, 4, 100)

blueshade, yellowshade = Sunset10[0], Sunset10[5]

p = figure(width=600, height=600, x_axis_label='x', y_axis_label='y',
           background_fill_color="#fafafa")
p.y_range.start = 0

p.circle(xpts, ypts, size=8, alpha=0.8, fill_color=yellowshade, line_color="black")

slope = Slope(gradient=slope, y_intercept=intercept,
              line_color=blueshade, line_dash='dashed', line_width=4)

p.add_layout(slope)

show(p)
