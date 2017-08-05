from os.path import join, dirname
import datetime

import pandas as pd
from scipy.signal import savgol_filter

from bokeh.io import curdoc
from bokeh.layouts import row, column
from bokeh.models import ColumnDataSource, DataRange1d, Select
from bokeh.palettes import Blues4
from bokeh.plotting import figure

STATISTICS = ['record_min_temp', 'actual_min_temp', 'average_min_temp', 'average_max_temp', 'actual_max_temp', 'record_max_temp']

def get_dataset(src, name, distribution):
    df = src[src.airport == name].copy()
    del df['airport']
    df['date'] = pd.to_datetime(df.date)
    # timedelta here instead of pd.DateOffset to avoid pandas bug < 0.18 (Pandas issue #11925)
    df['left'] = df.date - datetime.timedelta(days=0.5)
    df['right'] = df.date + datetime.timedelta(days=0.5)
    df = df.set_index(['date'])
    df.sort_index(inplace=True)
    if distribution == 'Smoothed':
        window, order = 51, 3
        for key in STATISTICS:
            df[key] = savgol_filter(df[key], window, order)

    return ColumnDataSource(data=df)

def make_plot(source, title):
    plot = figure(x_axis_type="datetime", plot_width=800, tools="", toolbar_location=None)
    plot.title.text = title

    plot.quad(top='record_max_temp', bottom='record_min_temp', left='left', right='right',
              color=Blues4[2], source=source, legend="Record")
    plot.quad(top='average_max_temp', bottom='average_min_temp', left='left', right='right',
              color=Blues4[1], source=source, legend="Average")
    plot.quad(top='actual_max_temp', bottom='actual_min_temp', left='left', right='right',
              color=Blues4[0], alpha=0.5, line_color="black", source=source, legend="Actual")

    # fixed attributes
    plot.xaxis.axis_label = None
    plot.yaxis.axis_label = "Temperature (F)"
    plot.axis.axis_label_text_font_style = "bold"
    plot.x_range = DataRange1d(range_padding=0.0)
    plot.grid.grid_line_alpha = 0.3

    return plot

def update_plot(attrname, old, new):
    city = city_select.value
    plot.title.text = "Weather data for " + cities[city]['title']

    src = get_dataset(df, cities[city]['airport'], distribution_select.value)
    source.data.update(src.data)

city = 'Austin'
distribution = 'Discrete'

cities = {
    'Austin': {
        'airport': 'AUS',
        'title': 'Austin, TX',
    },
    'Boston': {
        'airport': 'BOS',
        'title': 'Boston, MA',
    },
    'Seattle': {
        'airport': 'SEA',
        'title': 'Seattle, WA',
    }
}

city_select = Select(value=city, title='City', options=sorted(cities.keys()))
distribution_select = Select(value=distribution, title='Distribution', options=['Discrete', 'Smoothed'])

df = pd.read_csv(join(dirname(__file__), 'data/2015_weather.csv'))
source = get_dataset(df, cities[city]['airport'], distribution)
plot = make_plot(source, "Weather data for " + cities[city]['title'])

city_select.on_change('value', update_plot)
distribution_select.on_change('value', update_plot)

controls = column(city_select, distribution_select)

curdoc().add_root(row(plot, controls))
curdoc().title = "Weather"
