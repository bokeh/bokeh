from datetime import datetime as dt
import time

from bokeh.sampledata.daylight import daylight_warsaw_2013
from bokeh.plotting import figure, show, output_file
from bokeh.models import Span

output_file("span.html", title="span.py example")

p = figure(x_axis_type="datetime", y_axis_type="datetime")

p.line(daylight_warsaw_2013.Date, daylight_warsaw_2013.Sunset,
       line_dash='solid', line_width=2, legend="Sunset")
p.line(daylight_warsaw_2013.Date, daylight_warsaw_2013.Sunrise,
       line_dash='dotted', line_width=2, legend="Sunrise")

start_date = time.mktime(dt(2013, 3, 31, 2, 0, 0).timetuple())*1000
daylight_savings_start = Span(location=start_date,
                              dimension='height', line_color='green',
                              line_dash='dashed', line_width=3)
p.add_layout(daylight_savings_start)

end_date = time.mktime(dt(2013, 10, 27, 3, 0, 0).timetuple())*1000
daylight_savings_end = Span(location=end_date,
                            dimension='height', line_color='red',
                            line_dash='dashed', line_width=3)
p.add_layout(daylight_savings_end)

p.title.text = "2013 Sunrise and Sunset times in Warsaw"
p.yaxis.axis_label = 'Time of Day'

show(p)
