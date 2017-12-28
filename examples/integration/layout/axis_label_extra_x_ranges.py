from __future__ import absolute_import

from bokeh.plotting import figure, show
from bokeh.models import Range1d, LinearAxis

plot = figure(title=None, x_axis_location=None, y_axis_location=None)

plot.extra_y_ranges ['MD'] = Range1d(start=0, end=1)
plot.add_layout(LinearAxis(y_range_name='MD', axis_label = 'MD [m]'), 'left')

plot.extra_x_ranges ['foo1'] = Range1d(start=0, end=1)
plot.add_layout(LinearAxis(x_range_name='foo1', axis_label = 'foo1'), 'above')

plot.extra_x_ranges ['foo2'] = Range1d(start=0, end=10)
plot.add_layout(LinearAxis(x_range_name='foo2', axis_label = 'foo2'), 'above')

plot.extra_x_ranges ['foo3'] = Range1d(start=0, end=1)
plot.add_layout(LinearAxis(x_range_name='foo3', axis_label = 'foo3'), 'above')

plot.line(x=[0, 1], y=[0, 1], legend = 'foo1', x_range_name='foo1', y_range_name='MD')
plot.line(x=[10, 0], y=[0, 1], legend = 'foo2', x_range_name='foo2', y_range_name='MD', color='red')
plot.line(x=[0, 0.5], y=[0.5, 0], legend = 'foo3', x_range_name='foo3', y_range_name='MD')

show(plot)
