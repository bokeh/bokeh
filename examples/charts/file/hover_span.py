from collections import OrderedDict
import os
import numpy as np
import pandas as pd
from bokeh.models import HoverTool
from bokeh.charts import Chart, Step, Line, Area, Scatter, Bar, vplot, hplot, show, output_file

from py import path
HERE = path.local(__file__).dirpath()

xyvalues = pd.read_csv(str(HERE.join("percent-bachelors-degrees-women-usa.csv")))
index = xyvalues.pop("Year")
xyvalues = xyvalues[['Biology', 'Business', 'Computer Science']]


TOOLS='box_zoom,hover,crosshair,resize,reset'
output_file("lines.html", title="line.py example")
vline = Line(xyvalues, title="Lines V. Hover Interp", ylabel='measures', width=500, height=300,
             tools=TOOLS)
# steps = Step(xyvalues, title="Lines V. Hover", ylabel='measures', width=500, height=300,
#              tools=TOOLS, chart=vline)
# bar = Bar(xyvalues, title="Lines V. Hover", ylabel='measures', width=500, height=300,
#              tools=TOOLS)
hline = Line(xyvalues, title="Lines H. Hover Tap", ylabel='measures', width=500, height=300,
             tools=TOOLS)
svalues = {}
# svalues['Business'] = [(i, v) for i, v in zip(index, xyvalues['Business'])]
for k in xyvalues.columns:
    svalues[k] = [(i, v) for i, v in zip(index, xyvalues[k])]
# # import pdb; pdb.set_trace()
scatter = Scatter(svalues, title="Lines", ylabel='measures', width=1000, height=300,
             legend=True,
             tools=TOOLS)

int_point_line = Line(xyvalues, title="Lines Hover Point Interp.", ylabel='measures', width=500, height=300,
             tools=TOOLS)
tap_point_line = Line(xyvalues, title="Lines Hover Point Tap", ylabel='measures', width=500, height=300,
             tools=TOOLS)


hhover = hline.select(dict(type=HoverTool))
hhover.mode = 'vline'
hhover.hit_value_mode = 'hit_interpolate'

vhover = vline.select(dict(type=HoverTool))
vhover.mode = 'vline'

iphover = int_point_line.select(dict(type=HoverTool))
iphover.mode = 'point'
iphover.hit_value_mode = 'hit_interpolate'

tphover = tap_point_line.select(dict(type=HoverTool))
tphover.mode = 'point'


shover = scatter.select(dict(type=HoverTool))
shover.mode = 'vline'
tphover.tooltips = iphover.tooltips = shover.tooltips = vhover.tooltips = hhover.tooltips = OrderedDict([
    ("y", "$y"),
    # ("fill color", "$color[hex, swatch]:fill_color"),

    ("x", "$x"),
])

show(
    vplot(
        hplot(hline, vline),
        hplot(int_point_line, tap_point_line),
        scatter
    )
)
