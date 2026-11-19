''' Plot daily high temperature departures at six airports from July 2014 through June 2015.

``RecordDataSource.from_csv()`` reads the weather records and converts the
date and temperature fields. The color scale is centered at zero. Choose
an airport to replace the rows in the plot.

.. bokeh-example-metadata::
    :sampledata: airport_weather
    :apis: bokeh.models.sources.RecordDataSource, bokeh.models.Select, bokeh.transform.linear_cmap
    :refs: :ref:`ug_basic_data_record_source`
    :keywords: CSV, weather, scatter, color mapping

'''

from datetime import datetime

from bokeh.layouts import column
from bokeh.models import CustomJS, RecordDataSource, Select, Span
from bokeh.palettes import RdBu11, interp_palette
from bokeh.plotting import figure, show
from bokeh.sampledata.airport_weather import csv_path
from bokeh.transform import linear_cmap

weather = RecordDataSource.from_csv(
    csv_path,
    converters={"date": datetime.fromisoformat, "actual_max_temp": int, "average_max_temp": int},
)

airports = [
    ("KMDW", "Chicago Midway"),
    ("KHOU", "Houston Hobby"),
    ("KJAX", "Jacksonville"),
    ("KPHL", "Philadelphia"),
    ("KPHX", "Phoenix Sky Harbor"),
    ("KSEA", "Seattle-Tacoma"),
]
records_by_airport = {code: [] for code, _ in airports}
for row in weather.records:
    departure = row["actual_max_temp"] - row["average_max_temp"]
    records_by_airport[row["airport"]].append({"date": row["date"], "departure": departure})

initial_airport = "KSEA"
source = RecordDataSource(records=records_by_airport[initial_airport])

# Use a symmetric range across all airports and an odd palette size so zero
# maps to the neutral center color.
limit = max(abs(row["departure"]) for records in records_by_airport.values() for row in records)
palette = interp_palette(RdBu11, 257)
color = linear_cmap("departure", palette, low=-limit, high=limit)

plot = figure(title="How far was the daily high from typical?",
              width=735, height=410, x_axis_type="datetime", y_range=(-limit, limit),
              y_axis_label="Departure from typical high (°F)", tools=None)
plot.xgrid.grid_line_color = None
plot.add_layout(Span(location=0, dimension="width", line_color="#64748b", line_dash="dashed"))

points = plot.scatter("date", "departure", source=source, size=6, fill_color=color,
                      line_color="#334155", line_alpha=0.4, line_width=0.65)
plot.add_layout(points.construct_color_bar(title="Departure (°F)"), "right")

airport = Select(title="Airport", value=initial_airport, options=airports, width=180)
airport.js_on_change("value", CustomJS(args=dict(source=source, records_by_airport=records_by_airport), code="""
    source.records = records_by_airport[cb_obj.value]
"""))

show(column(airport, plot))
