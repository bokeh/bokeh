from datetime import datetime as dt

from bokeh.models import Span
from bokeh.plotting import figure, show
from bokeh.sampledata.daylight import daylight_warsaw_2013

p = figure(height=350, x_axis_type="datetime", y_axis_type="datetime",
           title="2013 Sunrise and Sunset in Warsaw with DST dates marked",
           y_axis_label="Time of Day", background_fill_color="#fafafa",)
p.y_range.start = 0
p.y_range.end = 24 * 60 * 60 * 1000

p.line("Date", "Sunset", source=daylight_warsaw_2013,
       color='navy', line_dash="dotted", line_width=2, legend_label="Sunset")
p.line("Date", "Sunrise", source=daylight_warsaw_2013,
       color='orange', line_dash="dashed", line_width=2, legend_label="Sunrise")

dst_start = Span(location=dt(2013, 3, 31, 2, 0, 0), dimension='height',
                 line_color='#009E73', line_width=5)
p.add_layout(dst_start)

dst_end = Span(location=dt(2013, 10, 27, 3, 0, 0), dimension='height',
               line_color='#009E73', line_width=5)
p.add_layout(dst_end)

p.yaxis.formatter.days = "%Hh"
p.xgrid.grid_line_color = None

show(p)
