from bokeh.models import BoxAnnotation
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.glucose import data

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

data = data.loc['2010-10-04':'2010-10-04']

p = figure(x_axis_type="datetime", tools=TOOLS, title="Glocose Readings, Oct 4th (Red = Outside Range)")
p.background_fill_color = "#efefef"
p.xgrid.grid_line_color=None
p.xaxis.axis_label = 'Time'
p.yaxis.axis_label = 'Value'

p.line(data.index, data.glucose, line_color='grey')
p.circle(data.index, data.glucose, color='grey', size=1)

p.add_layout(BoxAnnotation(top=80, fill_alpha=0.1, fill_color='red', line_color='red'))
p.add_layout(BoxAnnotation(bottom=180, fill_alpha=0.1, fill_color='red', line_color='red'))

output_file("box_annotation.html", title="box_annotation.py example")

show(p)
