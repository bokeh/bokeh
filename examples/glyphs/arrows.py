from __future__ import print_function

from math import pi, sin, cos

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.models.glyphs import Arrow
from bokeh.models import ColumnDataSource, Plot, Range1d
from bokeh.resources import INLINE

def polar_to_cartesian(r, alpha):
    return r*cos(alpha), r*sin(alpha)

n = 20
alpha = 2*pi/n

x1, y1 = zip(*[ polar_to_cartesian(0.5, i*alpha) for i in range(n) ])
filled = [ bool(i % 2) for i in range(n) ]
source = ColumnDataSource(data=dict(x1=x1, y1=y1, filled=filled))

xdr = Range1d(start=-1, end=1)
ydr = Range1d(start=-1, end=1)

plot = Plot(x_range=xdr, y_range=ydr, title="Arrows", plot_width=600, plot_height=600)

arrow = Arrow(x0=0, y0=0, x1='x1', y1='y1', length=10, filled="filled", fill_color="black")
plot.add_glyph(source, arrow)

doc = Document()
doc.add(plot)

if __name__ == "__main__":
    filename = "arrows.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Arrows"))
    print("Wrote %s" % filename)
    view(filename)
