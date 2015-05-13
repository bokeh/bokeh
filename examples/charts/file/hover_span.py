from bokeh.models import HoverTool
from bokeh.charts import Line, Scatter, vplot, hplot, show, output_file
from bokeh.sampledata.degrees import xyvalues

index = xyvalues.pop("Year")
xyvalues = xyvalues[['Biology', 'Business', 'Computer Science']]


TOOLS='box_zoom,box_select,hover,crosshair,resize,reset'
output_file("lines.html", title="line.py example")
vline = Line(xyvalues, title="Lines VLine", ylabel='measures', width=500, height=300,
             tools=TOOLS)
hline = Line(xyvalues, title="Lines HLine", ylabel='measures', width=500, height=300,
             tools=TOOLS)
int_vline = Line(xyvalues, title="Lines VLine Interp", ylabel='measures', width=500, height=300,
             tools=TOOLS)
int_hline = Line(xyvalues, title="Lines HLine Interp", ylabel='measures', width=500, height=300,
             tools=TOOLS)
svalues = {}
# svalues['Business'] = [(i, v) for i, v in zip(index, xyvalues['Business'])]
for k in xyvalues.columns:
    svalues[k] = [(i, v) for i, v in zip(index, xyvalues[k])]
# # import pdb; pdb.set_trace()
scatter_point = Scatter(svalues, title="Scatter mouse", ylabel='measures', width=500, height=300,
             legend=True,
             tools=TOOLS)
scatter = Scatter(svalues, title="Scatter V Line", ylabel='measures', width=500, height=300,
             legend=True,
             tools=TOOLS)

int_point_line = Line(xyvalues, title="Lines Mouse Interp.", ylabel='measures', width=500, height=300,
             tools=TOOLS)
point_line = Line(xyvalues, title="Lines Mouse", ylabel='measures', width=500, height=300,
             tools=TOOLS)


hhover = hline.select(dict(type=HoverTool))
hhover.mode = 'hline'
hhover.line_policy = 'next'

vhover = vline.select(dict(type=HoverTool))
vhover.mode = 'vline'
vhover.line_policy = 'nearest'

int_hhover = int_hline.select(dict(type=HoverTool))
int_hhover.mode = 'hline'
int_hhover.line_policy = 'interp'

int_vhover = int_vline.select(dict(type=HoverTool))
int_vhover.mode = 'vline'
int_vhover.line_policy = 'interp'

iphover = int_point_line.select(dict(type=HoverTool))
iphover.mode = 'mouse'
iphover.line_policy = 'interp'

tphover = point_line.select(dict(type=HoverTool))
tphover.mode = 'mouse'

shover = scatter.select(dict(type=HoverTool))
shover.mode = 'vline'

shoverp = scatter_point.select(dict(type=HoverTool))
shoverp.mode = 'mouse'

TOOLTIPS = [
    ("y", "$~y"),
    ("x", "$~x"),
]

int_vhover.tooltips = int_hhover.tooltips = TOOLTIPS
tphover.tooltips = iphover.tooltips = TOOLTIPS
shover.tooltips = shoverp.tooltips = TOOLTIPS
vhover.tooltips = hhover.tooltips = TOOLTIPS

show(
    vplot(
        hplot(hline, vline),
        hplot(int_hline, int_vline),
        hplot(int_point_line, point_line),
        hplot(scatter_point, scatter),
    )
)
