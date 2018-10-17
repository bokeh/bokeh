import numpy as np

from bokeh.plotting import figure, output_file, show
from bokeh.models import Legend, LegendItem
from bokeh.sampledata.stocks import AAPL, MSFT

def datetime(x):
    return np.array(x, dtype=np.datetime64)

p = figure(background_fill_color="#fafafa", x_axis_type="datetime",
           plot_width=800, plot_height=350)

r = p.multi_line([datetime(AAPL['date']), datetime(MSFT['date'])],
                 [AAPL['adj_close'], MSFT['adj_close']],
                 color=["navy", "crimson"], line_width=2, alpha=0.6)

legend = Legend(items=[
    LegendItem(label="AAPL", renderers=[r], index=0),
    LegendItem(label="MSFT", renderers=[r], index=1),
], location="top_left")
p.add_layout(legend)

output_file("multi_legend.html")

show(p)
