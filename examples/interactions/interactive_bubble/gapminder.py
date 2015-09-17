import pandas as pd

from jinja2 import Template

from bokeh.browserlib import view
from bokeh.models import (
    ColumnDataSource, Plot, Circle, Range1d,
    LinearAxis, HoverTool, Text,
    SingleIntervalTicker, CustomJS, Slider
)
from bokeh.palettes import Spectral6
from bokeh.plotting import vplot
from bokeh.resources import JSResources
from bokeh.embed import file_html

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
    title="",
    plot_width=800,
    plot_height=400,
    outline_line_color=None,
    toolbar_location=None,
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

xaxis = LinearAxis(SingleIntervalTicker(interval=1), axis_label="Children per woman (total fertility)", **AXIS_FORMATS)
yaxis = LinearAxis(SingleIntervalTicker(interval=20), axis_label="Life expectancy at birth (years)", **AXIS_FORMATS)
plot.add_layout(xaxis, 'below')
plot.add_layout(yaxis, 'left')


# ### Add the background year text
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
code = """
    var year = slider.get('value'),
        sources = %s,
        new_source_data = sources[year].get('data');
    renderer_source.set('data', new_source_data);
    text_source.set('data', {'year': [String(year)]});
""" % js_source_array

callback = CustomJS(args=sources, code=code)
slider = Slider(start=years[0], end=years[-1], value=1, step=1, title="Year", callback=callback, name='testy')
callback.args["renderer_source"] = renderer_source
callback.args["slider"] = slider
callback.args["text_source"] = text_source


# Stick the plot and the slider together
layout = vplot(plot, slider)

# Open our custom template
with open('gapminder_template.jinja', 'r') as f:
    template = Template(f.read())

# Use inline resources, render the html and open
js_resources = JSResources(mode='inline')
title = "Bokeh - Gapminder Bubble Plot"
html = file_html(layout, None, title, template=template, js_resources=js_resources)

output_file = 'gapminder.html'
with open(output_file, 'w') as f:
    f.write(html)
view(output_file)
