import io

from jinja2 import Template
import pandas as pd

from bokeh.core.properties import field
from bokeh.embed import file_html
from bokeh.layouts import column
from bokeh.models import (
    ColumnDataSource, Plot, Circle, Range1d, LinearAxis, HoverTool, Text,
    SingleIntervalTicker, CustomJS, Slider, CategoricalColorMapper, Legend,
    LegendItem,
)
from bokeh.models.annotations import Title
from bokeh.palettes import Spectral6
from bokeh.resources import JSResources
from bokeh.util.browser import view

from data import process_data

fertility_df, life_expectancy_df, population_df_size, regions_df, years, regions_list = process_data()

sources = {}

region_name = regions_df.Group
region_name.name = 'region'

for year in years:
    fertility = fertility_df[year]
    fertility.name = 'fertility'
    life = life_expectancy_df[year]
    life.name = 'life'
    population = population_df_size[year]
    population.name = 'population'
    new_df = pd.concat([fertility, life, population, region_name], axis=1)
    sources['_' + str(year)] = ColumnDataSource(new_df)

dictionary_of_sources = dict(zip([x for x in years], ['_%s' % x for x in years]))
js_source_array = str(dictionary_of_sources).replace("'", "")

xdr = Range1d(1, 9)
ydr = Range1d(20, 100)
plot = Plot(
    x_range=xdr,
    y_range=ydr,
    title=Title(text=''),
    plot_width=800,
    plot_height=400,
    outline_line_color=None,
    toolbar_location=None,
    min_border=20,
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


# ### Add the background year text
# We add this first so it is below all the other glyphs
text_source = ColumnDataSource({'year': ['%s' % years[0]]})
text = Text(x=2, y=35, text='year', text_font_size='150pt', text_color='#EEEEEE')
plot.add_glyph(text_source, text)

# Add the circle
color_mapper = CategoricalColorMapper(palette=Spectral6, factors=regions_list)
renderer_source = sources['_%s' % years[0]]
circle_glyph = Circle(
    x='fertility', y='life', size='population',
    fill_color={'field': 'region', 'transform': color_mapper},
    fill_alpha=0.8,
    line_color='#7c7e71', line_width=0.5, line_alpha=0.5)
circle_renderer = plot.add_glyph(renderer_source, circle_glyph)

# Add the hover (only against the circle and not other plot elements)
tooltips = "@index"
plot.add_tools(HoverTool(tooltips=tooltips, renderers=[circle_renderer]))
plot.add_layout(Legend(items=[LegendItem(label=field('region'), renderers=[circle_renderer])]))

# Add the slider
code = """
    var year = slider.value,
        sources = %s,
        new_source_data = sources[year].data;
    renderer_source.data = new_source_data;
    text_source.data = {'year': [String(year)]};
""" % js_source_array

callback = CustomJS(args=sources, code=code)
slider = Slider(start=years[0], end=years[-1], value=1, step=1, title="Year", callback=callback, name='testy')
callback.args["renderer_source"] = renderer_source
callback.args["slider"] = slider
callback.args["text_source"] = text_source


# Stick the plot and the slider together
layout = column(plot, slider)

# Open our custom template
with open('gapminder_template.jinja', 'r') as f:
    template = Template(f.read())

# Use inline resources, render the html and open
js_resources = JSResources(mode='inline')
title = "Bokeh - Gapminder Bubble Plot"
html = file_html(layout, resources=(js_resources, None), title=title, template=template)

output_file = 'gapminder.html'
with io.open(output_file, mode='w', encoding='utf-8') as f:
    f.write(html)
view(output_file)
