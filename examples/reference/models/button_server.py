## Bokeh server for button click

from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import Button
from bokeh.plotting import figure

x=[3,4,6,12,10,1]
y=[7,1,3,4,1,6]

source = ColumnDataSource(data=dict(x=x, y=y))

plot_figure = figure(plot_height=450, plot_width=600,
              tools="save,reset",
              x_range=[0,14], y_range=[0,12],toolbar_location="below")

plot_figure.scatter('x', 'y', source=source, size=10)

button = Button(label="Click to set plot title", button_type="success")

def button_click():
    plot_figure.title.text = 'Button Clicked'

button.on_click(button_click)

layout=row(button,plot_figure)

curdoc().add_root(layout)
curdoc().title = "Button Bokeh Server"
