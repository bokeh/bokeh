## Bokeh server for MultiSelect
import pandas as pd
from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import MultiSelect
from bokeh.plotting import figure

x=[3,4,6,12,10,1]
y=[7,1,3,4,1,6]
label=['Red', 'Orange', 'Red', 'Orange','Red', 'Orange']

df=pd.DataFrame({'x':x,'y':y,'label':label}) #create a dataframe for future use

source = ColumnDataSource(data=dict(x=x, y=y,label=label))

plot_figure = figure(title='Multi-Select',plot_height=450, plot_width=600,
              tools="save,reset", toolbar_location="below")

plot_figure.scatter('x', 'y',color='label', source=source, size=10)

multi_select = MultiSelect(title="Filter Plot by color:", value=["Red", "Orange"],
                           options=[("Red", "Red"), ("Orange", "Orange")])

def multiselect_click(attr,old,new):
    active_mselect=multi_select.value ##Getting multi-select value

    selected_df=df[df['label'].isin(active_mselect)] #filter the dataframe with value in multi-select

    source.data=dict(x=selected_df.x, y=selected_df.y,label=selected_df.label)


multi_select.on_change('value',multiselect_click)

layout=row(multi_select, plot_figure)

curdoc().add_root(layout)
curdoc().title = "Multi-Select Bokeh Server"
