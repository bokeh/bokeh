''' An interval chart showing Olympic sprint time data as intervals.

.. bokeh-example-metadata::
    :sampledata: sprint
    :apis: bokeh.plotting.figure.hbar
    :refs: :ref:`ug_basic_bars_intervals`
    :keywords: bar, hbar

'''
from bokeh.models import ColumnDataSource
from bokeh.plotting import figure, show
from bokeh.sampledata.sprint import sprint

df = sprint.copy()  # since we are modifying sampledata

df.Year = df.Year.astype(str)
group = df.groupby('Year')
source = ColumnDataSource(group)

p = figure(y_range=group, x_range=(9.5,12.7), width=400, height=550, toolbar_location=None,
           title="Time Spreads for Sprint Medalists (by Year)")
p.hbar(y="Year", left='Time_min', right='Time_max', height=0.4, source=source)

p.ygrid.grid_line_color = None
p.xaxis.axis_label = "Time (seconds)"
p.outline_line_color = None

show(p)
