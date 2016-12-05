from bokeh.sampledata.glucose import data
from bokeh.plotting import figure, show, output_file
from bokeh.models import BoxAnnotation

output_file("box_annotation.html", title="box_annotation.py example")

TOOLS = "pan,wheel_zoom,box_zoom,reset,save"

#reduce data size
data = data.ix['2010-10-06':'2010-10-13']

p = figure(x_axis_type="datetime", tools=TOOLS)

p.line(data.index.to_series(), data['glucose'], line_color="gray", line_width=1, legend="glucose")

low_box = BoxAnnotation(top=80, fill_alpha=0.1, fill_color='red')
mid_box = BoxAnnotation(bottom=80, top=180, fill_alpha=0.1, fill_color='green')
high_box = BoxAnnotation(bottom=180, fill_alpha=0.1, fill_color='red')

p.add_layout(low_box)
p.add_layout(mid_box)
p.add_layout(high_box)

p.title.text = "Glucose Range"
p.xgrid[0].grid_line_color=None
p.ygrid[0].grid_line_alpha=0.5
p.xaxis.axis_label = 'Time'
p.yaxis.axis_label = 'Value'

show(p)
