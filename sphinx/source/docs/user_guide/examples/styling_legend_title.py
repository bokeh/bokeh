import pandas as pd

from bokeh.palettes import Spectral4
from bokeh.plotting import figure, output_file, show
from bokeh.sampledata.stocks import AAPL, GOOG, IBM, MSFT

output_file("styling_legend_title.html", title="styling_legend_title.py example")

p = figure(plot_width=800, plot_height=250, x_axis_type="datetime")

for data, name, color in zip([AAPL, IBM, MSFT, GOOG], ["AAPL", "IBM", "MSFT", "GOOG"], Spectral4):
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    p.line(df['date'], df['close'], line_width=2, color=color, legend_label=name)

p.legend.location = "top_left"
p.legend.title = 'Stock'
p.legend.title_text_font_style = "bold"
p.legend.title_text_font_size = "20px"

show(p)
