import time

from numpy import exp, linspace, pi, sin

from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models import (Circle, ColumnDataSource, DatetimeAxis,
                          PanTool, Plot, WheelZoomTool,)
from bokeh.resources import INLINE
from bokeh.util.browser import view

N = 200
x = linspace(-2 * pi, 2 * pi, N)
y = sin(x)*exp(-x)

# Create an array of synthetic times, starting at the current time, and extending 24hrs
times = (linspace(0, 24*3600, N) + time.time()) * 1000

source = ColumnDataSource(data=dict(x=x, y=y, times=times))

plot = Plot(min_border=80, plot_width=800, plot_height=350, background_fill_color="#efefef")

circle = Circle(x="times", y="y", fill_color="red", size=3, line_color=None, fill_alpha=0.5)
plot.add_glyph(source, circle)

plot.add_layout(DatetimeAxis(), 'below')
plot.add_layout(DatetimeAxis(), 'left')

plot.add_tools(PanTool(), WheelZoomTool(zoom_on_axis=False, speed=1/5000.))

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "dateaxis.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Date Axis Example"))
    print("Wrote %s" % filename)
    view(filename)
