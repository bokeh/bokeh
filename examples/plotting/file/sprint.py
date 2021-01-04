# Based on http://www.nytimes.com/interactive/2012/08/05/sports/olympics/the-100-meter-dash-one-race-every-medalist-ever.html

from bokeh.models import (Arrow, ColumnDataSource, CustomJS, DataRange1d,
                          FixedTicker, HoverTool, Label, LinearAxis, NormalHead,
                          Range1d, SingleIntervalTicker, TapTool,)
from bokeh.plotting import figure, output_file, show
from bokeh.sampledata.sprint import sprint

abbrev_to_country = {
    "USA": "United States",
    "GBR": "Britain",
    "JAM": "Jamaica",
    "CAN": "Canada",
    "TRI": "Trinidad and Tobago",
    "AUS": "Australia",
    "GER": "Germany",
    "CUB": "Cuba",
    "NAM": "Namibia",
    "URS": "Soviet Union",
    "BAR": "Barbados",
    "BUL": "Bulgaria",
    "HUN": "Hungary",
    "NED": "Netherlands",
    "NZL": "New Zealand",
    "PAN": "Panama",
    "POR": "Portugal",
    "RSA": "South Africa",
    "EUA": "United Team of Germany",
}

gold_fill   = "#efcf6d"
gold_line   = "#c8a850"
silver_fill = "#cccccc"
silver_line = "#b0b0b1"
bronze_fill = "#c59e8a"
bronze_line = "#98715d"

fill_color = { "gold": gold_fill, "silver": silver_fill, "bronze": bronze_fill }
line_color = { "gold": gold_line, "silver": silver_line, "bronze": bronze_line }

def selected_name(name, medal, year):
    return name if medal == "gold" and year in [1988, 1968, 1936, 1896] else ""

t0 = sprint.Time[0]

sprint["Abbrev"]       = sprint.Country
sprint["Country"]      = sprint.Abbrev.map(lambda abbr: abbrev_to_country[abbr])
sprint["Medal"]        = sprint.Medal.map(lambda medal: medal.lower())
sprint["Speed"]        = 100.0/sprint.Time
sprint["MetersBack"]   = 100.0*(1.0 - t0/sprint.Time)
sprint["MedalFill"]    = sprint.Medal.map(lambda medal: fill_color[medal])
sprint["MedalLine"]    = sprint.Medal.map(lambda medal: line_color[medal])
sprint["SelectedName"] = sprint[["Name", "Medal", "Year"]].apply(tuple, axis=1).map(lambda args: selected_name(*args))

source = ColumnDataSource(sprint)

xdr = Range1d(start=sprint.MetersBack.max()+2, end=0)               # XXX: +2 is poor-man's padding (otherwise misses last tick)
ydr = DataRange1d(range_padding=4, range_padding_units="absolute")

plot = figure(
    x_range=xdr, y_range=ydr,
    plot_width=1000, plot_height=600,
    toolbar_location=None,
    outline_line_color=None, y_axis_type=None)

plot.title.text = "Usain Bolt vs. 116 years of Olympic sprinters"
plot.title.text_font_size = "19px"

plot.xaxis.ticker = SingleIntervalTicker(interval=5, num_minor_ticks=0)
plot.xaxis.axis_line_color = None
plot.xaxis.major_tick_line_color = None
plot.xgrid.grid_line_dash = "dashed"

yticker = FixedTicker(ticks=[1900, 1912, 1924, 1936, 1952, 1964, 1976, 1988, 2000, 2012])
yaxis = LinearAxis(ticker=yticker, major_tick_in=-5, major_tick_out=10)
plot.add_layout(yaxis, "right")

medal = plot.circle(x="MetersBack", y="Year", radius=dict(value=5, units="screen"),
    fill_color="MedalFill", line_color="MedalLine", fill_alpha=0.5, source=source, level="overlay")

plot.text(x="MetersBack", y="Year", x_offset=10, y_offset=-5, text="SelectedName",
    text_align="left", text_baseline="middle", text_font_size="12px", source=source)

no_olympics_label = Label(
    x=7.5, y=1942,
    text="No Olympics in 1940 or 1944",
    text_align="center", text_baseline="middle",
    text_font_size="12px", text_font_style="italic", text_color="silver")
no_olympics = plot.add_layout(no_olympics_label)

x = sprint[sprint.Year == 1900].MetersBack.min() - 0.5
arrow = Arrow(x_start=x, x_end=5, y_start=1900, y_end=1900, start=NormalHead(fill_color="black", size=6), end=None, line_width=1.5)
plot.add_layout(arrow)

meters_back = Label(
    x=5, x_offset=10, y=1900,
    text="Meters behind 2012 Bolt",
    text_align="left", text_baseline="middle",
    text_font_size="13px", text_font_style="bold")
plot.add_layout(meters_back)

disclaimer = Label(
    x=0, y=0, x_units="screen", y_units="screen",
    text="This chart includes medals for the United States and Australia in the \"Intermediary\" Games of 1906, which the I.O.C. does not formally recognize.",
    text_font_size="11px", text_color="silver")
plot.add_layout(disclaimer, "below")

tooltips = """
<div>
    <span style="font-size: 15px;">@Name</span>&nbsp;
    <span style="font-size: 10px; color: #666;">(@Abbrev)</span>
</div>
<div>
    <span style="font-size: 17px; font-weight: bold;">@Time{0.00}</span>&nbsp;
    <span style="font-size: 10px; color: #666;">@Year</span>
</div>
<div style="font-size: 11px; color: #666;">@{MetersBack}{0.00} meters behind</div>
"""

plot.add_tools(HoverTool(tooltips=tooltips, renderers=[medal]))

open_url = CustomJS(args=dict(source=source), code="""
source.inspected._1d.indices.forEach(function(index) {
    var name = source.data["Name"][index];
    var url = "http://en.wikipedia.org/wiki/" + encodeURIComponent(name);
    window.open(url);
});
""")

plot.add_tools(TapTool(callback=open_url, renderers=[medal], behavior="inspect"))

output_file("sprint.html", plot.title.text)
show(plot)
