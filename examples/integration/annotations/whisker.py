from __future__ import absolute_import

from bokeh.io import save
from bokeh.models import Plot, Range1d, Whisker, OpenHead, ColumnDataSource

x_range = Range1d(0, 10)
y_range = Range1d(0, 10)

# Have to specify x/y range as labels aren't included in the plot area solver
plot = Plot(plot_width=600, plot_height=600,
            x_range=x_range, y_range=y_range, toolbar_location=None)

source = ColumnDataSource(data=dict(
    x1 = [1,3,5,7,9],
    lower1 = [1,2,1,2,1],
    upper1 = [2,3,2,3,2],
    x2 = [200, 250, 350, 450, 550],
    lower2 = [400, 300, 400, 300, 400],
    upper2 = [500, 400, 500, 400, 500],
))

whisker1 = Whisker(base='x1', lower='lower1', upper='upper1',
                   line_width=3, line_color='red', line_dash='dashed',
                   source=source)

whisker2 = Whisker(base='x2', lower='lower2', upper='upper2', upper_head=OpenHead(),
                   base_units='screen', lower_units='screen', upper_units='screen',
                   dimension='width', line_width=3, line_color='green',
                   source=source)

plot.add_layout(whisker1)
plot.add_layout(whisker2)

save(plot)
