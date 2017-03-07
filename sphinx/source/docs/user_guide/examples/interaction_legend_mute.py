import pandas as pd

from bokeh.palettes import Spectral4
from bokeh.plotting import figure, output_file, show

p = figure(plot_width=800, plot_height=250, x_axis_type="datetime")
p.title.text = 'Click on legend entries to mute the corresponding lines'

for name, color in zip(['AAPL', 'IBM', 'MSFT', 'GOOG'], Spectral4):
    df = pd.read_csv(
        "http://ichart.yahoo.com/table.csv?s=%s&a=0&b=1&c=2005&d=0&e=1&f=2014" % name,
        parse_dates=['Date']
    )
    p.line(df['Date'], df['Close'], line_width=2, color=color, alpha=0.8, muted_alpha=0.2, legend=name)

p.legend.location = "top_left"
p.legend.click_policy="mute"

output_file("interactive_legend.html", title="interactive_legend.py example")

show(p)
