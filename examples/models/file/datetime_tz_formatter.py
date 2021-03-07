"""
Example demonstrating DatetimeTickFormatter with tick labels displayed in different timezones.
"""
from bokeh.io import output_file, show  # output_notebook
from bokeh.models import ColumnDataSource, FuncTickFormatter, DatetimeTickFormatter
from bokeh.models.axes import DatetimeAxis
from bokeh.models.tools import HoverTool
from bokeh.plotting import figure

from jinja2 import Template
import numpy as np
import pandas as pd

# output_notebook()

# create dummy time series
t = pd.Timestamp("2021/02/11 23:01-05:00")
# NOTE: currently, HoverTool is not natively capable of displaying
# sub-millisecond precision when formatting timestamps. As a workaround,
# one can store sub-millisecond values in a separate column for a given
# ColumnDataSource and use the printf formatter to display those values.
interval = np.timedelta64(250, "ms") + np.timedelta64(50, "us")
df = pd.DataFrame({"t": [t, t + interval, t + 2 * interval], "v": [1, 3, 2]})


def make_datetime_tz_formatter(display_timezone, include_date=False):
    """Creates a bokeh.TickFormatter to display datetimes with TZ

    Uses the javascript Date.toLocateString methods to get timestamp
    string for given timezone. This is a lot less flexible than say
    strftime since there are a limited set of locale formats to choose from,
    but it works okay for more conventional string representations.
    """
    js_code_template = """
var dt = new Date(tick);
var tz = "{{ display_timezone }}";
var locale_date_str = dt.toLocaleDateString("sv-SE", {"timeZone": tz});  // yyyy-mm-dd, currently not using
var locale_time_str = dt.toLocaleTimeString("en-GB", {"timeZone": tz});  // 24 hour time
{% if include_date %}
locale_time_str = locale_date_str.slice(-5) + " " + locale_time_str;
{% endif %}

// bokeh uses floating point precision to represent sub-millisecond resolution,
// can round to get intended microsecond value
var millis = Math.floor(tick) % 1000;

// build timestamp string
var result = "";
if (millis == 0) {
    result = locale_time_str;
} else {
    // leftpad milliseconds to 3 digits
    result = locale_time_str + "." + ("000" + millis).slice(-3);
}
return result;
"""
    js_code = Template(js_code_template).render(display_timezone=display_timezone, include_date=include_date)
    return FuncTickFormatter(code=js_code)


def make_figure():
    # note: bokeh datetime tooltip formatter is limited to millisecond precision. Sub-millisecond precision
    # would have to be provided separately.
    tools = [
        "xpan",
        # "wheel_zoom",  # does not work if there is a bound y-axis
        "xwheel_zoom",
        "xzoom_in",
        "xzoom_out",
        "box_zoom",
        "reset",
        HoverTool(tooltips=[("time", "($x{%H:%M:%S.%N}, $y)")], formatters={"$x": "datetime"}),
    ]
    f = figure(x_axis_type="datetime", height=800, width=800, tools=tools, toolbar_location="above")

    datetime_fmt = {
        "microseconds": "%H:%M:%S.%f",
        "milliseconds": "%H:%M:%S.%f",
        "seconds": "%H:%M:%S",
        "minsec": "%H:%M:%S",
        "minutes": "%H:%M:%S",
        "hourmin": "%H:%M:%S",
        "hours": "%H:%M:%S",
        "days": "%x",
    }

    source = ColumnDataSource(df)
    f.line(x="t", y="v", source=source)
    extra_axis = DatetimeAxis(axis_label="DatetimeTickFormatter", formatter=DatetimeTickFormatter(**datetime_fmt))
    f.add_layout(extra_axis, "below")
    for tz in ("UTC", "US/Eastern", "Asia/Tokyo", "Asia/Calcutta"):
        extra_axis = DatetimeAxis(
            axis_label="FuncTickFormatter:" + tz,
            formatter=make_datetime_tz_formatter(tz, include_date=True),
        )
        f.add_layout(extra_axis, "below")
        extra_axis = DatetimeAxis(
            axis_label="DatetimeTickFormatter:" + tz,
            formatter=DatetimeTickFormatter(timezone=tz, **datetime_fmt),
        )
        f.add_layout(extra_axis, "below")
    return f


output_file("datetime_tz_formatter.html", title="Timezones")
show(make_figure())
