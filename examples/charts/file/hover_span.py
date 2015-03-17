from collections import OrderedDict
import os
import numpy as np
import pandas as pd
from bokeh.models import HoverTool
from bokeh.charts import Chart, Step, Line, Area, Scatter, vplot, hplot, show, output_file

from py import path
HERE = path.local(__file__).dirpath()

xyvalues = pd.read_csv(str(HERE.join("percent-bachelors-degrees-women-usa.csv")))
index = xyvalues.pop("Year")
xyvalues = xyvalues[['Biology', 'Business', 'Computer Science']]


TOOLS='box_zoom,hover,crosshair,resize,reset'
output_file("lines.html", title="line.py example")
vline = Line(xyvalues, title="Lines V. Hover", ylabel='measures', width=500, height=300,
             tools=TOOLS)
hline = Line(xyvalues, title="Lines H. Hover", ylabel='measures', width=500, height=300,
             tools=TOOLS)
svalues = {}
# svalues['Business'] = [(i, v) for i, v in zip(index, xyvalues['Business'])]
for k in xyvalues.columns:
    svalues[k] = [(i, v) for i, v in zip(index, xyvalues[k])]
# # import pdb; pdb.set_trace()
scatter = Scatter(svalues, title="Lines", ylabel='measures', width=1000, height=300,
             legend=True,
             tools=TOOLS)

hhover = hline.select(dict(type=HoverTool))
hhover.mode = 'hline'
vhover = vline.select(dict(type=HoverTool))
vhover.mode = 'vline'
shover = scatter.select(dict(type=HoverTool))
shover.mode = 'vline'
shover.tooltips = vhover.tooltips = hhover.tooltips = OrderedDict([
    ("y", "$y"),
    # ("fill color", "$color[hex, swatch]:fill_color"),
    # ("geomy", "$geomy"),
    # ("sy", "$sy"),
    # ("vy", "$vy"),
    # ("ry", "$ry"),
#     # ("x", "$y"),
#     # ("geomx", "$y"),
])

show(vplot(hplot(hline, vline), scatter))
