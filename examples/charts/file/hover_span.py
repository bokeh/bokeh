from bokeh.models import HoverTool
from bokeh.charts import Line, Scatter, vplot, hplot, show, output_file, defaults
import pandas as pd
from bokeh.sampledata.degrees import xyvalues

defaults.width = 500
defaults.height = 300

xyvalues = xyvalues[['Biology', 'Business', 'Computer Science', "Year"]]
xyvalues = pd.melt(xyvalues, id_vars=['Year'],
                   value_vars=['Biology', 'Business', 'Computer Science'],
                   value_name='Count', var_name='Degree')

TOOLS='box_zoom,box_select,hover,crosshair,resize,reset'
output_file("hover_span.html", title="line.py example")

vline = Line(xyvalues, y='Count', color='Degree', title="Lines VLine", ylabel='measures',
             tools=TOOLS)

hline = Line(xyvalues, y='Count', color='Degree', title="Lines HLine",
             ylabel='measures', tools=TOOLS)

int_vline = Line(xyvalues, y='Count', color='Degree', title="Lines VLine Interp",
                 ylabel='measures', tools=TOOLS)

int_hline = Line(xyvalues, y='Count', color='Degree', title="Lines HLine Interp",
                 ylabel='measures', tools=TOOLS)

scatter_point = Scatter(xyvalues, x='Year', y='Count', color='Degree',
                        title="Scatter mouse", ylabel='measures', legend=True,
                        tools=TOOLS)
scatter = Scatter(xyvalues, x='Year', y='Count', color='Degree',
                  title="Scatter V Line", ylabel='measures', legend=True, tools=TOOLS)

int_point_line = Line(xyvalues, x='Year', y='Count', color='Degree',
                      title="Lines Mouse Interp.", ylabel='measures', tools=TOOLS)

point_line = Line(xyvalues, x='Year', y='Count', color='Degree',
                  title="Lines Mouse", ylabel='measures', tools=TOOLS)


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
