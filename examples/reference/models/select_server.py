## Bokeh server for Select
import pandas as pd
from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import Select
from bokeh.plotting import figure

x=[3,4,6,12,10,1,5,6,3,8]
y=[7,1,3,4,1,6,10,4,10,3]
label=['Red', 'Orange', 'Red', 'Orange','Red', 'Orange','Red', 'Orange','Red', 'Orange',]

df=pd.DataFrame({'x':x,'y':y,'label':label})

source = ColumnDataSource(data=dict(x=df.x, y=df.y,label=df.label))

plot_figure = figure(title='Select',plot_height=450, plot_width=600,
              tools="save,reset", toolbar_location="below")

plot_figure.scatter('x', 'y', source=source, size=10,color='label')

select = Select(title="Filter plot by color:", value="All", options=["All", "Red", "Orange"])

def select_click(attr,old,new):
    active_select=select.value ##Getting radio button value

    # filter the dataframe with value in select
    if active_select!='All':
        selected_df=df[df['label']==active_select]
    else:
        selected_df=df.copy()

    source.data=dict(x=selected_df.x, y=selected_df.y,label=selected_df.label)


select.on_change('value',select_click)

layout=row(select, plot_figure)

curdoc().add_root(layout)
curdoc().title = "Select Bokeh Server"
