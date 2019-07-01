## Bokeh server for Slider
import pandas as pd
from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import Slider
from bokeh.plotting import figure
import numpy as np

x = np.linspace(0, 10, 500)
y=np.sin(x)

df=pd.DataFrame({'x':x,'y':y})

source = ColumnDataSource(data=dict(x=df.x, y=df.y))

plot_figure = figure(title='Slider',plot_height=450, plot_width=600,
              tools="save,reset", toolbar_location="below")

plot_figure.line('x', 'y', line_width=3, source=source)

slider = Slider(start=0.1, end=10, value=1, step=.1, title="Change Frequency")

def slider_change(attr,old,new):
    slider_value=slider.value ##Getting radio button value

    y_change=np.sin(x*slider_value)

    source.data=dict(x=x, y=y_change)


slider.on_change('value',slider_change)

layout=row(slider, plot_figure)

curdoc().add_root(layout)
curdoc().title = "Slider Bokeh Server"
