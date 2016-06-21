import pandas as pd

from bokeh.io import curdoc
from bokeh.models import (ColumnDataSource, HoverTool, Text, Div, WidgetBox, Text, Circle,
                          SingleIntervalTicker, Slider, Button, Column, Label)
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

desc = Div(text="""
In Hans Rosling's <a href="http://www.ted.com/talks/hans_rosling_shows_the_best_stats_you_ve_ever_seen">iconic TED Talk</a>
he showed why our ongoing perceptions of a "first" world and a "third" world are wrong and that the world is now a spectrum
of developing countries and many advances have been made since our early notions of development from the 60s.
""", render_as_text=False, width=800
)

plot = figure(x_range=(1,9), y_range=(20,100), title='Gapminder Data')
plot.xaxis.ticker = SingleIntervalTicker(interval=1)
plot.yaxis.ticker = SingleIntervalTicker(interval=20)

label = Label(x=1, y=20, text=str(years[0]), text_font_size='100pt', text_color='#EEEEEE')
plot.add_layout(label)

# Add the circle
cr = plot.circle(x='fertility', y='life', size='population', source=sources[years[0]],
                fill_color='region_color', fill_alpha=0.8,
                line_color='#7c7e71', line_width=0.5, line_alpha=0.5)

# Add the hover (only against the circle and not other plot elements)
plot.add_tools(HoverTool(tooltips="@index", renderers=[cr]))

# Add a custom legend
tx, ty = 7, 95
for i, region in enumerate(regions):
    plot.add_glyph(Text(x=tx, y=ty, text=[region], text_font_size='10pt', text_color='#666666'))
    plot.add_glyph(Circle(x=tx-0.1, y=ty+2, fill_color=Spectral6[i], size=10, line_color=None, fill_alpha=0.8))
    ty -= 5

# Add the slider
slider = Slider(start=years[0], end=years[-1], value=years[0], step=1, title="Year")

# Update the years when the animation is running
def animate_update ():
    year = slider.value + 1
    if year > years[-1]: year = years[0]
    slider.value = year

# Start or stop the animation if the slider is moved and update the values
def slider_update (attrname, old, new):
    year = slider.value
    label.text = str(year)
    cr.data_source.data = sources[year].data

slider.on_change('value', slider_update)

# Add animation button
button = Button(label='Start')

# Start or stop the animation when clicked
def animate ():
    if button.label == 'Start':
        button.label = 'Stop'
        curdoc().add_periodic_callback(animate_update, 200)
    else:
        button.label = 'Start'
        curdoc().remove_periodic_callback(animate_update)

button.on_click(animate)

# Stick the plot, slider, and button together
layout = Column(desc, plot, WidgetBox(slider, button))

curdoc().add_root(layout)
curdoc().title = "Bokeh Gapminder Example"
