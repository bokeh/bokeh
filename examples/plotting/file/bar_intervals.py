from bokeh.io import show, output_file
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure
from bokeh.sampledata.sprint import sprint

output_file("bar_intervals.html")

sprint.Year = sprint.Year.astype(str)
group = sprint.groupby('Year')
source = ColumnDataSource(group)

p = figure(y_range=group, x_range=(9.5,12.7), plot_width=400, plot_height=550, toolbar_location=None,
           title="Time Spreads for Sprint Medalists (by Year)")
p.hbar(y="Year", left='Time_min', right='Time_max', height=0.4, source=source)

p.ygrid.grid_line_color = None
p.xaxis.axis_label = "Time (seconds)"
p.outline_line_color = None

show(p)
