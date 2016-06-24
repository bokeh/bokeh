import pandas as pd

from bokeh.charts import Line, Scatter, show, output_file, defaults
from bokeh.layouts import gridplot
from bokeh.models import HoverTool
from bokeh.sampledata.degrees import data

defaults.width = 500
defaults.height = 300

TOOLS='box_zoom,box_select,hover,crosshair,reset'

TOOLTIPS = [ ("y", "$~y"), ("x", "$~x") ]

data = data[['Biology', 'Business', 'Computer Science', "Year"]]
data = pd.melt(data, id_vars=['Year'],
               value_vars=['Biology', 'Business', 'Computer Science'],
               value_name='Count', var_name='Degree')

vline = Line(data, y='Count', color='Degree', title="Lines VLine", ylabel='measures',
             tools=TOOLS)

hline = Line(data, y='Count', color='Degree', title="Lines HLine",
             ylabel='measures', tools=TOOLS)

int_vline = Line(data, y='Count', color='Degree', title="Lines VLine Interp",
                 ylabel='measures', tools=TOOLS)

int_hline = Line(data, y='Count', color='Degree', title="Lines HLine Interp",
                 ylabel='measures', tools=TOOLS)

scatter_point = Scatter(data, x='Year', y='Count', color='Degree',
                        title="Scatter mouse", ylabel='measures', legend=True,
                        tools=TOOLS)

scatter = Scatter(data, x='Year', y='Count', color='Degree',
                  title="Scatter V Line", ylabel='measures', legend=True, tools=TOOLS)

int_point_line = Line(data, x='Year', y='Count', color='Degree',
                      title="Lines Mouse Interp.", ylabel='measures', tools=TOOLS)

point_line = Line(data, x='Year', y='Count', color='Degree',
                  title="Lines Mouse", ylabel='measures', tools=TOOLS)


hhover = hline.select(HoverTool)
hhover.mode = 'hline'
hhover.line_policy = 'next'

vhover = vline.select(HoverTool)
vhover.mode = 'vline'
vhover.line_policy = 'nearest'

int_hhover = int_hline.select(HoverTool)
int_hhover.mode = 'hline'
int_hhover.line_policy = 'interp'

int_vhover = int_vline.select(HoverTool)
int_vhover.mode = 'vline'
int_vhover.line_policy = 'interp'

iphover = int_point_line.select(HoverTool)
iphover.mode = 'mouse'
iphover.line_policy = 'interp'

tphover = point_line.select(HoverTool)
tphover.mode = 'mouse'

shover = scatter.select(HoverTool)
shover.mode = 'vline'

shoverp = scatter_point.select(HoverTool)
shoverp.mode = 'mouse'

# set up tooltips
int_vhover.tooltips = int_hhover.tooltips = TOOLTIPS
tphover.tooltips = iphover.tooltips = TOOLTIPS
shover.tooltips = shoverp.tooltips = TOOLTIPS
vhover.tooltips = hhover.tooltips = TOOLTIPS

output_file("hover_span.html", title="hover_span.py example")

show(gridplot(hline, vline, int_hline, int_vline,
              int_point_line, point_line, scatter_point, scatter,
              ncols=2))
