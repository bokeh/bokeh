import pandas as pd

from bokeh.io import curdoc
from bokeh.layouts import layout, widgetbox
from bokeh.models import (ColumnDataSource, HoverTool, Text, Div, Circle,
                          SingleIntervalTicker, Slider, Button, Label)
from bokeh.palettes import Spectral6
from bokeh.plotting import figure

from data import process_data

fertility_df, life_expectancy_df, population_df_size, regions_df, years, regions = process_data()

sources = {}

region_color = regions_df['region_color']
region_color.name = 'region_color'

for year in years:
    fertility = fertility_df[year]
    fertility.name = 'fertility'
    life = life_expectancy_df[year]
    life.name = 'life'
    population = population_df_size[year]
    population.name = 'population'
    df = pd.concat([fertility, life, population, region_color], axis=1)
    df = df.fillna('NaN')
    sources[year] = ColumnDataSource(df)

plot = figure(x_range=(1,9), y_range=(20,100), title='Gapminder Data', plot_height=300)
plot.xaxis.ticker = SingleIntervalTicker(interval=1)
plot.xaxis.axis_label = "Children per woman (total fertility)"
plot.yaxis.ticker = SingleIntervalTicker(interval=20)
plot.yaxis.axis_label = "Life expectancy at birth (years)"

label = Label(x=1.1, y=18, text=str(years[0]), text_font_size='70pt', text_color='#eeeeee')
plot.add_layout(label)

cr = plot.circle(x='fertility', y='life', size='population', source=sources[years[0]],
                fill_color='region_color', fill_alpha=0.8,
                line_color='#7c7e71', line_width=0.5, line_alpha=0.5)

plot.add_tools(HoverTool(tooltips="@index", renderers=[cr]))

# this draws a custom legend
tx, ty = 6.3, 95
for i, region in enumerate(regions):
    plot.add_glyph(Text(x=tx, y=ty, text=[region], text_font_size='10pt', text_color='#666666'))
    plot.add_glyph(Circle(x=tx-0.1, y=ty+2, fill_color=Spectral6[i], size=10, line_color=None, fill_alpha=0.8))
    ty -= 5

def animate_update ():
    year = slider.value + 1
    if year > years[-1]: year = years[0]
    slider.value = year

def slider_update (attrname, old, new):
    year = slider.value
    label.text = str(year)
    cr.data_source.data = sources[year].data

slider = Slider(start=years[0], end=years[-1], value=years[0], step=1, title="Year")
slider.on_change('value', slider_update)


def animate ():
    if button.label == '► Play':
        button.label = '❚❚ Pause'
        curdoc().add_periodic_callback(animate_update, 200)
    else:
        button.label = '► Play'
        curdoc().remove_periodic_callback(animate_update)

button = Button(label='► Play', width=60)
button.on_click(animate)

layout = layout([
    [plot],
    [slider, button],
], sizing_mode='scale_width')

curdoc().add_root(layout)
curdoc().title = "Gapminder"
