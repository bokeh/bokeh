from numpy import arange

from bokeh.models import MathText, FixedTicker
from bokeh.plotting import figure, show

x = arange(1, 4.5, 0.25)
y = 1 / x

plot = figure(min_border=80, height=400)
plot.circle(x, y, fill_color="blue", size=5)

plot.xaxis.axis_label = "Resistance"
plot.xaxis.ticker = FixedTicker(ticks=[1,2,3,4])
plot.yaxis.axis_label = "Current at 1 V"

plot.xaxis.major_label_overrides = {
    1: MathText(text=r"1\Omega"),
    2: MathText(text=r"2\Omega"),
    3: MathText(text=r"3\Omega"),
    4: MathText(text=r"4\Omega"),
    }

show(plot)
