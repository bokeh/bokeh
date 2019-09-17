## Bokeh server for checkbox group

from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import CheckboxGroup
from bokeh.plotting import figure

x=[3,4,6,12,10,1]
y=[7,1,3,4,1,6]

source = ColumnDataSource(data=dict(x=x, y=y))

plot_figure = figure(title='Checkbox',plot_height=450, plot_width=600,
              tools="save,reset",toolbar_location="below")

plot_figure.scatter('x', 'y', source=source, size=10)

checkbox = CheckboxGroup(labels=['Show x-axis label','Show y-axis label'])

def checkbox_click(attr,old,new):
    active_checkbox=checkbox.active ##Getting checkbox value in list

    ## Get first checkbox value and show x-axis label

    if len(active_checkbox)!=0 and (0 in active_checkbox):
        plot_figure.xaxis.axis_label='X-Axis'
    else:
        plot_figure.xaxis.axis_label = None

    ## Get second checkbox value and show y-axis label

    if len(active_checkbox)!=0 and (1 in active_checkbox):
        plot_figure.yaxis.axis_label='Y-Axis'
    else:
        plot_figure.yaxis.axis_label = None

checkbox.on_change('active',checkbox_click)

layout=row(checkbox, plot_figure)

curdoc().add_root(layout)
curdoc().title = "Checkbox Bokeh Server"
