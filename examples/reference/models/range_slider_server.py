## Bokeh server for Range Slider

from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import RangeSlider
from bokeh.plotting import figure
from bokeh.sampledata.us_marriages_divorces import data

df=data.copy()

source = ColumnDataSource(data=dict(year=df.Year, population=df.Population,marriagep1000=df.Marriages_per_1000,divorcep1000=df.Divorces_per_1000))

plot_figure = figure(title='Range Slider',plot_height=450, plot_width=600,
              tools="save,reset", toolbar_location="below")

plot_figure.scatter('divorcep1000', 'marriagep1000', size=5, source=source)

plot_figure.xaxis.axis_label='Divorces Per 1000'
plot_figure.yaxis.axis_label='Marriages Per 1000'

range_slider = RangeSlider(start=1867, end=2011, value=(1867,2011), step=1, title="Filter Year")

def slider_change(attr,old,new):
    slider_value=range_slider.value ##Getting slider value
    slider_low_range=slider_value[0]
    slider_high_range=slider_value[1]

    filtered_df=df[(df['Year'] >= slider_low_range) & (df['Year']<=slider_high_range)]

    source.data=dict(year=filtered_df.Year, population=filtered_df.Population,
                     marriagep1000=filtered_df.Marriages_per_1000,divorcep1000=filtered_df.Divorces_per_1000)


range_slider.on_change('value',slider_change)

layout=row(range_slider, plot_figure)

curdoc().add_root(layout)
curdoc().title = "Range Slider Bokeh Server"
