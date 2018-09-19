from __future__ import absolute_import

from bokeh.plotting import figure, save
from bokeh.models import CategoricalAxis

f1 = "foo\n1234567\nXYZT"
f2 = "barrrrrr\nsome long text on this line\n1234567890 xyz\nuvw uvw uvw uvw"
f3 = "baz-100000000"

factors = [f1, f2, f3]
x = [f1, f1, f1, f2, f2, f2, f3, f3, f3]
y = [f1, f2, f3, f1, f2, f3, f1, f2, f3]

colors = [
    "#0B486B", "#79BD9A", "#CFF09E",
    "#79BD9A", "#0B486B", "#79BD9A",
    "#CFF09E", "#79BD9A", "#0B486B"
]

plot = figure(title="Multiline categorical axis labels", toolbar_location=None,
              x_range=factors, y_range=factors,
              x_axis_type=None, y_axis_type=None)

plot.add_layout(CategoricalAxis(), "left")
plot.add_layout(CategoricalAxis(), "right")
plot.add_layout(CategoricalAxis(), "above")
plot.add_layout(CategoricalAxis(), "below")

plot.rect(x, y, color=colors, width=1, height=1)

save(plot)
