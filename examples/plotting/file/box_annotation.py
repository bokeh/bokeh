''' A timeseries plot of glucose data readings. This example demonstrates
adding box annotations as well as a multi-line title.

.. bokeh-example-metadata::
    :sampledata: glucose
    :apis: bokeh.plotting.figure.line, bokeh.plotting.figure.scatter, bokeh.models.annotations.BoxAnnotation
    :refs: :ref:`userguide_annotations` > :ref:`userguide_annotations_box_annotations`
    :keywords: box annotation, time series

'''
from bokeh.models import BoxAnnotation
from bokeh.plotting import figure, show
from bokeh.sampledata.glucose import data

data = data.loc['2010-10-04':'2010-10-04']

p = figure(title="Glucose Readings, Oct 4th\n(Red = Outside Range)",
           x_axis_type="datetime", tools="pan,wheel_zoom,box_zoom,reset,save")
p.background_fill_color = "#efefef"
p.xgrid.grid_line_color=None
p.xaxis.axis_label = 'Time'
p.yaxis.axis_label = 'Value'

p.line(data.index, data.glucose, line_color='grey')
p.scatter(data.index, data.glucose, color='grey', size=1)

p.add_layout(BoxAnnotation(top=80, fill_alpha=0.1, fill_color='red', line_color='red'))
p.add_layout(BoxAnnotation(bottom=180, fill_alpha=0.1, fill_color='red', line_color='red'))

show(p)
