import pandas as pd
from bokeh.charts import TimeSeries
from bokeh.models import (
    Legend,
    Circle,
    HoverTool,
    ColumnDataSource,
    GlyphRenderer
)
from bokeh.palettes import brewer

TOOLS = "hover"
palette = brewer["Blues"][3]

apple = pd.read_csv(
    "http://ichart.yahoo.com/table.csv?s=AAPL&a=0&b=1&c=2000&d=0&e=1&f=2010",
    parse_dates=['Date']
)

# Basic sparkline

sparkline = TimeSeries(
    apple[['Adj Close', 'Date']], index='Date',
    title="", tools=TOOLS, height=100, palette=palette,
    ylabel='', xlabel='', xgrid=None, ygrid=None,
    filename="sparkline.html"
)
sparkline.add_layout(
    Legend(
        legends=[('Apple', None), ],
        orientation="top_left",
        border_line_color="white",
        label_text_font_style="bold"
    )
)

sparkline.left[0].visible = False
sparkline.below[0].visible = False
sparkline.toolbar_location = None
sparkline.min_border = 0
sparkline.outline_line_color = None

# Optional goodies
# - Add a dot at either end
# - with hover information
fmt = '%d %b \'%y'
apple['FormattedDate'] = apple['Date'].apply(lambda x: x.strftime(fmt))
apple['Close'] = apple['Adj Close']  # Can't seem to do tooltips with space in column name
dot_source = ColumnDataSource(
    apple[['Close', 'Date', 'FormattedDate']].iloc[[0, -1]]
)

# A small pink circle
circle = Circle(
    x='Date', y='Close',
    fill_color="#df65b0", size=5, line_color=None
)
# A larger blank circle to make it easier to hit the hover
blank_circle = Circle(
    x='Date', y='Close',
    fill_color=None, size=20, line_color=None
)
circle_renderer = GlyphRenderer(data_source=dot_source, glyph=circle)
blank_circle_renderer = GlyphRenderer(data_source=dot_source, glyph=blank_circle)
sparkline.renderers.extend([circle_renderer, blank_circle_renderer])

# Add a hover
hover = sparkline.select({"type": HoverTool})[0]
date = "@FormattedDate"
close = "@Close"
hover.tooltips = "{date} <strong>{close}</strong>".format(date=date, close=close)

sparkline.show()
