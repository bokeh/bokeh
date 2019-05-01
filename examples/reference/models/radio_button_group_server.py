## Bokeh server for Radio Button Group
import pandas as pd
from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import RadioButtonGroup
from bokeh.plotting import figure

x=[3,4,6,12,10,1,5,6,3,8]
y=[7,1,3,4,1,6,10,4,10,3]
label=['Red', 'Orange', 'Red', 'Orange','Red', 'Orange','Red', 'Orange','Red', 'Orange',]

df=pd.DataFrame({'x':x,'y':y,'label':label})

source = ColumnDataSource(data=dict(x=df.x, y=df.y,label=df.label))

plot_figure = figure(title='Radio Button Group',plot_height=450, plot_width=600,
              tools="save,reset", toolbar_location="below")

plot_figure.scatter('x', 'y',color='label', source=source, size=10)

radio_button_group = RadioButtonGroup(labels=["Red", "Orange"])

def radiogroup_click(attr,old,new):
    active_radio=radio_button_group.active ##Getting radio button value

    # filter the dataframe with value in radio-button
    if active_radio==0:
        selected_df = df[df['label'] == 'Red']
    elif active_radio==1:
        selected_df = df[df['label'] == "Orange"]

    source.data=dict(x=selected_df.x, y=selected_df.y,label=selected_df.label)


radio_button_group.on_change('active',radiogroup_click)

layout=row(radio_button_group, plot_figure)

curdoc().add_root(layout)
curdoc().title = "Radio Button Group Bokeh Server"
