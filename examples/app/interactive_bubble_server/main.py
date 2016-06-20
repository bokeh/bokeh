import pandas as pd

import numpy as np

from bokeh.models import (
    ColumnDataSource, Plot, Circle, Range1d,
    LinearAxis, HoverTool, Text,
    SingleIntervalTicker, Slider, Button
)
from bokeh.palettes import Spectral6
from bokeh.models.layouts import Column
from bokeh.models.annotations import Title
from bokeh.io import curdoc
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
    new_df = pd.concat([fertility, life, population, region_color], axis=1)
    sources['_' + str(year)] = ColumnDataSource(new_df)

dictionary_of_sources = dict(zip([x for x in years], ['_%s' % x for x in years]))
js_source_array = str(dictionary_of_sources).replace("'", "")

xdr = Range1d(1, 9)
ydr = Range1d(20, 100)
plot = Plot(
    x_range=xdr,
    y_range=ydr,
    title=Title(text='Gapminder Server'),
    plot_width=800,
    plot_height=500,
    outline_line_color=None,
    toolbar_location=None,
    min_border = 20,
)
AXIS_FORMATS = dict(
    minor_tick_in=None,
    minor_tick_out=None,
    major_tick_in=None,
    major_label_text_font_size="10pt",
    major_label_text_font_style="normal",
    axis_label_text_font_size="10pt",

    axis_line_color='#AAAAAA',
    major_tick_line_color='#AAAAAA',
    major_label_text_color='#666666',

    major_tick_line_cap="round",
    axis_line_cap="round",
    axis_line_width=1,
    major_tick_line_width=1,
)

xaxis = LinearAxis(ticker=SingleIntervalTicker(interval=1), axis_label="Children per woman (total fertility)", **AXIS_FORMATS)
yaxis = LinearAxis(ticker=SingleIntervalTicker(interval=20), axis_label="Life expectancy at birth (years)", **AXIS_FORMATS)
plot.add_layout(xaxis, 'below')
plot.add_layout(yaxis, 'left')


# Add the background year text
# We add this first so it is below all the other glyphs
text_source = ColumnDataSource({'year': ['%s' % years[0]]})
text = Text(x=2, y=35, text='year', text_font_size='150pt', text_color='#EEEEEE')
plot.add_glyph(text_source, text)

# Add the circle
renderer_source = sources['_%s' % years[0]]
circle_glyph = Circle(
    x='fertility', y='life', size='population',
    fill_color='region_color', fill_alpha=0.8,
    line_color='#7c7e71', line_width=0.5, line_alpha=0.5)
circle_renderer = plot.add_glyph(renderer_source, circle_glyph)

# Add the hover (only against the circle and not other plot elements)
tooltips = "@index"
plot.add_tools(HoverTool(tooltips=tooltips, renderers=[circle_renderer]))


# Add the legend
text_x = 7
text_y = 95
for i, region in enumerate(regions):
    plot.add_glyph(Text(x=text_x, y=text_y, text=[region], text_font_size='10pt', text_color='#666666'))
    plot.add_glyph(Circle(x=text_x - 0.1, y=text_y + 2, fill_color=Spectral6[i], size=10, line_color=None, fill_alpha=0.8))
    text_y = text_y - 5

# Add the slider
slider = Slider(start=years[0], end=years[-1], value=1, step=1, title="Year", name='test', width=800)

# Create anim_update to detect if it is the user or the animation that is updating the slider
anim_update = False

# Replace numpy NaNs in data since they are invalid JSON values and will cause errors
def replace_nans (data):
    for key in data:
        data[key] = ['NaN' if pd.isnull(value) else value for value in data[key]]
    return data

# Update the years when the animation is running
def update ():
    global text_source
    global renderer_source
    global slider
    global anim_update
    if text_source.data['year'] == [str(years[-1])]:
        text_source.data['year'] = [str(years[0])]
    else:
        text_source.data['year'] = [str(int(text_source.data['year'][0]) + 1)]
    new_data = sources['_' + text_source.data['year'][0]].data
    new_data = replace_nans(new_data)
    renderer_source.data = new_data
    anim_update = True
    slider.value = int(text_source.data['year'][0])
    anim_update = False

# Start or stop the animation if the slider is moved and update the values
def slider_update (attrname,old,new):
    if button.label == 'Stop' and anim_update == False:
        button.label = 'Start'
        curdoc().remove_periodic_callback(update)
    text_source.data['year'] = [str(slider.value)]
    new_data = sources['_' + text_source.data['year'][0]].data
    new_data = replace_nans(new_data)
    renderer_source.data = new_data

slider.on_change('value',slider_update)

# Add animation button
button = Button(label='Start', width=800)

# Start or stop the animation when clicked
def startanim ():
    if button.label == 'Start':
        button.label = 'Stop'
        curdoc().add_periodic_callback(update, 200)
    else:
        button.label = 'Start'
        curdoc().remove_periodic_callback(update)

button.on_click(startanim)

# Stick the plot, slider, and button together
layout = Column(plot, slider, button)
curdoc().add_root(layout)
