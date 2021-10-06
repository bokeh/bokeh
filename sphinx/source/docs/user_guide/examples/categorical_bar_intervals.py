from bokeh.io import output_file, show
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure
from bokeh.sampledata.sprint import sprint

output_file("sprint.html")

sprint.Year = sprint.Year.astype(str)
group = sprint.groupby('Year')
source = ColumnDataSource(group)

p = figure(y_range=group, x_range=(9.5,12.7), width=400, height=550, toolbar_location=None,
           title="Time spreads for sprint medalists (by year)")
p.hbar(y="Year", left='Time_min', right='Time_max', height=0.4, source=source)

p.ygrid.grid_line_color = None
p.xaxis.axis_label = "Time (seconds)"
p.outline_line_color = None

show(p)
