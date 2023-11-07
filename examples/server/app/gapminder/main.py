''' A gapminder chart using a population, life expectancy, and fertility dataset.
This example shows the data visualization capability of Bokeh to recreate charts.

'''
import pandas as pd

from bokeh.io import curdoc
from bokeh.layouts import layout
from bokeh.models import (Button, CategoricalColorMapper, ColumnDataSource,
                          HoverTool, Label, SingleIntervalTicker, Slider)
from bokeh.palettes import Spectral6
from bokeh.plotting import figure

from .data import process_data

fertility_df, life_expectancy_df, population_df_size, regions_df, years, regions_list = process_data()

df = pd.concat({'fertility': fertility_df,
                'life': life_expectancy_df,
                'population': population_df_size},
               axis=1)

data = {}

regions_df.rename({'Group':'region'}, axis='columns', inplace=True)
for year in years:
    df_year = df.iloc[:,df.columns.get_level_values(1)==year]
    df_year.columns = df_year.columns.droplevel(1)
    data[year] = df_year.join(regions_df.region).reset_index().to_dict('series')

source = ColumnDataSource(data=data[years[0]])

plot = figure(x_range=(1, 9), y_range=(20, 100), title='Gapminder Data', height=300)
plot.xaxis.ticker = SingleIntervalTicker(interval=1)
plot.xaxis.axis_label = "Children per woman (total fertility)"
plot.yaxis.ticker = SingleIntervalTicker(interval=20)
plot.yaxis.axis_label = "Life expectancy at birth (years)"

label = Label(x=1.1, y=22, text=str(years[0]), text_font_size='80px', text_color='#eeeeee')
plot.add_layout(label)

color_mapper = CategoricalColorMapper(palette=Spectral6, factors=regions_list)
plot.scatter(
    x='fertility',
    y='life',
    size='population',
    source=source,
    fill_color={'field': 'region', 'transform': color_mapper},
    fill_alpha=0.8,
    line_color='#7c7e71',
    line_width=0.5,
    line_alpha=0.5,
    legend_group='region',
)
plot.add_tools(HoverTool(tooltips="@Country", show_arrow=False, point_policy='follow_mouse'))


def animate_update():
    year = slider.value + 1
    if year > years[-1]:
        year = years[0]
    slider.value = year


def slider_update(attrname, old, new):
    year = slider.value
    label.text = str(year)
    source.data = data[year]

slider = Slider(start=years[0], end=years[-1], value=years[0], step=1, title="Year")
slider.on_change('value', slider_update)

callback_id = None

def animate():
    global callback_id
    if button.label == '► Play':
        button.label = '❚❚ Pause'
        callback_id = curdoc().add_periodic_callback(animate_update, 200)
    else:
        button.label = '► Play'
        curdoc().remove_periodic_callback(callback_id)

button = Button(label='► Play', width=60)
button.on_event('button_click', animate)

layout = layout([
    [plot],
    [slider, button],
], sizing_mode='scale_width')

curdoc().add_root(layout)
curdoc().title = "Gapminder"
