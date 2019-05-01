## Bokeh server for Dropdown

from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import Dropdown
from bokeh.plotting import figure

x=[3,4,6,12,10,1]
y=[7,1,3,4,1,6]
c=['blue','blue','blue','blue','blue','blue']
source = ColumnDataSource(data=dict(x=x, y=y,color=c))

plot_figure = figure(title='Dropdown',plot_height=450, plot_width=600,
              tools="save,reset", toolbar_location="below")

plot_figure.scatter('x', 'y',color='color', source=source, size=10)

menu = [("Red", "red"), ("Green", "green")]
dropdown = Dropdown(label="Choose color for plot", menu=menu)

def dropdown_click(attr,old,new):
    active_dropdown=dropdown.value ##Getting dropdown value

    if active_dropdown=='red':
        c = ['red', 'red', 'red', 'red', 'red', 'red']
    elif active_dropdown=='green':
        c = ['green', 'green', 'green', 'green', 'green', 'green']
    source.data=dict(x=x, y=y,color=c)

dropdown.on_change('value',dropdown_click)

layout=row(dropdown, plot_figure)

curdoc().add_root(layout)
curdoc().title = "Checkbox Bokeh Server"
