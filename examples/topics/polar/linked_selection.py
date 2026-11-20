''' Select the same synthetic wind observations in polar and Cartesian scatter plots.

Both plots share a ColumnDataSource, so a box or lasso selection in either
view highlights the corresponding observations in the other. Bearings run
clockwise from north. Blue marks the first 18 hours and orange the last
18 hours. Red highlights selected observations. The observations use a
fixed random seed.

.. bokeh-example-metadata::
    :title: Linked polar and Cartesian selection
    :keywords: polar, scatter, linked brushing, selection, lasso, time series
    :apis: bokeh.models.PolarMapping, bokeh.models.ColumnDataSource, bokeh.models.CustomJS, bokeh.plotting.figure.scatter
    :refs: :ref:`ug_topics_polar`, :ref:`ug_interaction_linked_brushing`
    :gallery: A polar wind plot and a Cartesian time-series scatter plot highlight the same selected observations.

'''
from datetime import datetime, timedelta

import numpy as np

from bokeh.layouts import column, row
from bokeh.models import (
    ColumnDataSource,
    CustomJS,
    CustomJSTickFormatter,
    Div,
    FixedTicker,
    HoverTool,
    PolarAxis,
    PolarMapping,
    Range1d,
)
from bokeh.plotting import figure, show

rng = np.random.default_rng(23)
hours = np.linspace(0, 36, 180)
bearing = (235 + 72*np.sin(hours/6) + rng.normal(0, 11, len(hours))) % 360
speed = np.clip(5 + 2.4*np.sin(hours/3.8) + rng.normal(0, 0.85, len(hours)), 0.4, 11)
source = ColumnDataSource(dict(
    bearing=bearing, speed=speed,
    time=[datetime(2026, 10, 1) + timedelta(hours=float(hour)) for hour in hours],
    color=np.where(hours < 18, "#3985a4", "#da9250"),
))

tools = "pan,wheel_zoom,box_select,lasso_select,tap,reset,save"
polar = figure(
    title="Wind direction and speed",
    width=480, height=440,
    coordinate_system=PolarMapping(radial_range=Range1d(0, 11), zero_direction="north", direction="clock"),
    tools=tools, active_drag="box_select", active_scroll="wheel_zoom",
    background_fill_color="#fbfcfe",
)
timeline = figure(
    title="The same observations over time",
    width=610, height=440,
    x_axis_type="datetime", y_range=(0, 11),
    x_axis_label="Observation time", y_axis_label="Wind speed (m/s)",
    tools=tools, active_drag="box_select", active_scroll="wheel_zoom",
    background_fill_color="#fbfcfe",
)
for plot, x, y in ((polar, "speed", "bearing"), (timeline, "time", "speed")):
    plot.scatter(x, y, source=source, size=8, color="color", alpha=0.8, line_color="white", line_width=0.4,
                 selection_color="#bb3858", selection_alpha=1, nonselection_alpha=0.12)
    plot.add_tools(HoverTool(tooltips=[
        ("Time", "@time{%a %H:%M}"),
        ("Direction", "@bearing{0}°"),
        ("Speed", "@speed{0.0} m/s"),
    ], formatters={"@time": "datetime"}))

angular_axis = next(axis for axis in polar.select(PolarAxis)
                    if isinstance(axis, PolarAxis) and axis.dimension == "angular")
angular_axis.ticker = FixedTicker(ticks=list(range(0, 360, 45)))
angular_axis.formatter = CustomJSTickFormatter(code="""
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(tick/45) % 8]
""")

key = Div(text="Blue: first 18 hours. Orange: last 18 hours. Red: selected observations.")
count = Div(text="Drag a box or lasso in either plot to select observations in both views.")
source.selected.js_on_change("indices", CustomJS(args=dict(source=source, count=count), code="""
    count.text = `${cb_obj.indices.length} of ${source.data.speed.length} observations selected in both views.`
"""))

show(column(row(polar, timeline), key, count))
