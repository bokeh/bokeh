from __future__ import print_function

from math import pi
import pandas as pd

from bokeh.models import (
    Plot, ColumnDataSource, FactorRange, CategoricalAxis, TapTool, HoverTool, OpenURL, CategoricalScale)
from bokeh.models.glyphs import Rect
from bokeh.colors import groups
from bokeh.document import Document
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.util.browser import view

data = []
for name in groups.__all__:
    group = getattr(groups, name)
    data.extend([(str(x), x.to_hex(), group.__name__) for x in group])

css3_colors = pd.DataFrame(data, columns=["Name", "Color", "Group"])

source = ColumnDataSource(dict(
    names  = list(css3_colors.Name),
    groups = list(css3_colors.Group),
    colors = list(css3_colors.Color),
))

xdr = FactorRange(factors=list(css3_colors.Group.unique()))
ydr = FactorRange(factors=list(reversed(css3_colors.Name)))
x_scale, y_scale = CategoricalScale(), CategoricalScale()

plot = Plot(x_range=xdr, y_range=ydr, x_scale=x_scale, y_scale=y_scale, plot_width=600, plot_height=2000)
plot.title.text = "CSS3 Color Names"

rect = Rect(x="groups", y="names", width=1, height=1, fill_color="colors", line_color=None)
rect_renderer = plot.add_glyph(source, rect)

xaxis_above = CategoricalAxis(major_label_orientation=pi/4)
plot.add_layout(xaxis_above, 'above')

xaxis_below = CategoricalAxis(major_label_orientation=pi/4)
plot.add_layout(xaxis_below, 'below')

plot.add_layout(CategoricalAxis(), 'left')

url = "http://www.colors.commutercreative.com/@names/"
tooltips = """Click the color to go to:<br /><a href="{url}">{url}</a>""".format(url=url)

tap = TapTool(renderers=[rect_renderer], callback=OpenURL(url=url))
hover = HoverTool(renderers=[rect_renderer], tooltips=tooltips)
plot.tools.extend([tap, hover])

doc = Document()
doc.add_root(plot)

if __name__ == "__main__":
    doc.validate()
    filename = "colors.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "CSS3 Color Names"))
    print("Wrote %s" % filename)
    view(filename)
