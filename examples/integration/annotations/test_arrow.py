from __future__ import absolute_import

from bokeh.io import save
from bokeh.plotting import figure
from bokeh.models import Arrow, OpenHead, NormalHead, TeeHead, VeeHead

# Have to specify x/y range as labels aren't included in the plot area solver
plot = figure(width=600, height=600, x_range=(0,10), y_range=(0,10), toolbar_location=None)

arrow1 = Arrow(x_start=1, y_start=4, x_end=6, y_end=9,
               line_color='green', line_alpha=0.7,
               line_dash='8 4', line_width=5, end=OpenHead()
               )
arrow1.end.line_width=8

arrow2 = Arrow(x_start=2, y_start=3, x_end=7, y_end=8,
               start=NormalHead(), end=VeeHead()
               )
arrow2.start.fill_color = 'indigo'
arrow2.end.fill_color = 'orange'
arrow2.end.size = 50

plot.add_layout(arrow1)
plot.add_layout(arrow2)

# test arrow body clipping
plot.add_layout(Arrow(start=TeeHead(line_width=1), x_start=6, y_start=5, x_end=8, y_end=6, line_width=10))
plot.add_layout(Arrow(start=VeeHead(line_width=1, fill_color="white"), x_start=6, y_start=4, x_end=8, y_end=5, line_width=10))
plot.add_layout(Arrow(start=NormalHead(line_width=1, fill_color="white"), x_start=6, y_start=3, x_end=8, y_end=4, line_width=10))
plot.add_layout(Arrow(start=OpenHead(line_width=1), x_start=6, y_start=2, x_end=8, y_end=3, line_width=10))

save(plot)
