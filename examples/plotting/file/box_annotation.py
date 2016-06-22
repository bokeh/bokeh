from bokeh.models import BoxAnnotation
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.glucose import data

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

# reduce data size
data = data.ix['2010-10-06':'2010-10-13']

p = figure(x_axis_type="datetime", tools=TOOLS, title="Glocose Range")
p.xgrid.grid_line_color=None
p.ygrid.grid_line_alpha=0.5
p.xaxis.axis_label = 'Time'
p.yaxis.axis_label = 'Value'

p.line(data.index, data.glucose, line_color="gray")

p.add_layout(BoxAnnotation(top=80, fill_alpha=0.1, fill_color='red'))
p.add_layout(BoxAnnotation(bottom=80, top=180, fill_alpha=0.1, line_color='olive', fill_color='olive'))
p.add_layout(BoxAnnotation(bottom=180, fill_alpha=0.1, fill_color='red'))

output_file("box_annotation.html", title="box_annotation.py example")

show(p)
