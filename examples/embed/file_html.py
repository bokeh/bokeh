import yaml

from bokeh.document import Document
from bokeh.models import (CDSView, Circle, ColumnDataSource, DataRange1d,
                          Grid, HoverTool, IndexFilter, LinearAxis, Plot,
                          Range1d, SingleIntervalTicker, Text,)
from bokeh.resources import INLINE
from bokeh.sampledata.sprint import sprint
from bokeh.themes import Theme

# Based on http://www.nytimes.com/interactive/2012/08/05/sports/olympics/the-100-meter-dash-one-race-every-medalist-ever.html

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

fill_color = { "gold": "#efcf6d", "silver": "#cccccc", "bronze": "#c59e8a" }
line_color = { "gold": "#c8a850", "silver": "#b0b0b1", "bronze": "#98715d" }

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

xdr =Range1d(start=25, end=-0.5)
ydr = DataRange1d(range_padding=2, range_padding_units="absolute")

plot = Plot(plot_width=1000, x_range=xdr, y_range=ydr, toolbar_location=None)
plot.title.text = "Usain Bolt vs. 116 years of Olympic sprinters"

xticker = SingleIntervalTicker(interval=5, num_minor_ticks=0)
xaxis = LinearAxis(ticker=xticker, axis_label="Meters behind 2012 Bolt")
plot.add_layout(xaxis, "below")

xgrid = Grid(dimension=0, ticker=xaxis.ticker)
plot.add_layout(xgrid)

yticker = SingleIntervalTicker(interval=12, num_minor_ticks=0)
yaxis = LinearAxis(ticker=yticker, major_tick_in=-5, major_tick_out=10)
plot.add_layout(yaxis, "right")

filters = [IndexFilter(list(sprint.query('Medal == "gold" and Year in [1988, 1968, 1936, 1896]').index))]

medal = Circle(x="MetersBack", y="Year", size=10, fill_color="MedalFill", line_color="MedalLine", fill_alpha=0.5)
medal_renderer = plot.add_glyph(source, medal)

#sprint[sprint.Medal=="gold" * sprint.Year in [1988, 1968, 1936, 1896]]
plot.add_glyph(source, Text(x="MetersBack", y="Year", x_offset=10, text="Name"), view=CDSView(source=source, filters=filters))

plot.add_glyph(source, Text(x=7.5, y=1942, text=["No Olympics in 1940 or 1944"],
                            text_font_style="italic", text_color="silver"))

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

hover = HoverTool(tooltips=tooltips, renderers=[medal_renderer])
plot.add_tools(hover)

theme = Theme(json=yaml.safe_load("""
attrs:
    Plot:
        outline_line_color: !!null
    Axis:
        axis_line_color: !!null
        major_tick_line_color: !!null
        axis_label_text_font_style: "bold"
        axis_label_text_font_size: "10pt"
    Grid:
        grid_line_dash: "dashed"
    Text:
        text_baseline: "middle"
        text_align: "center"
        text_font_size: "9pt"
"""))

doc = Document(theme=theme)
doc.add_root(plot)

if __name__ == "__main__":
    from bokeh.embed import file_html
    from bokeh.util.browser import view

    doc.validate()
    filename = "file_html.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, plot.title.text))
    print("Wrote %s" % filename)
    view(filename)
