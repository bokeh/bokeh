from random import random

from bokeh.models import ColumnDataSource, CustomJS
from bokeh.plotting import figure, show

x = [random() for x in range(500)]
y = [random() for y in range(500)]
s = ColumnDataSource(data=dict(x=x, y=y))

p = figure(width=400, height=400, tools="lasso_select", title="Select Here")
p.scatter('x', 'y', color='navy', size=8, source=s, alpha=0.4,
          selection_color="firebrick")

s2 = ColumnDataSource(data=dict(x=[0, 1], ym=[0.5, 0.5]))
p.line(x='x', y='ym', color="orange", line_width=5, alpha=0.6, source=s2)

s.selected.js_on_change('indices', CustomJS(args=dict(s=s, s2=s2), code="""
    const inds = s.selected.indices
    if (inds.length > 0) {
        const ym = inds.reduce((a, b) => a + s.data.y[b], 0) / inds.length
        s2.data = { x: s2.data.x, ym: [ym, ym] }
    }
"""))

show(p)
