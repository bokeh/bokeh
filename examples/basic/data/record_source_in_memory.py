from bokeh.models import RecordDataSource
from bokeh.plotting import figure, show

source = RecordDataSource(records=[
    {"hour": 0, "height": 1.2},
    {"hour": 6, "height": 2.5},
    {"hour": 12, "height": 3.6},
    {"hour": 18, "height": 2.3},
    {"hour": 24, "height": 1.4},
])

plot = figure(title="Wave forecast · West Shoal buoy", width=640, height=410,
              x_axis_label="Hours since forecast issue", y_axis_label="Wave height (m)",
              tooltips=[("Forecast hour", "@hour h"), ("Wave height", "@height{0.0} m")])

plot.line("hour", "height", source=source, line_color="#0f766e", line_width=3)
plot.scatter("hour", "height", source=source, color="#0f766e", size=10)

show(plot)
