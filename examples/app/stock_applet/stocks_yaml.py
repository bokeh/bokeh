"""
This file demonstrates a bokeh applet, which can be viewed directly
on a bokeh-server. See the README.md file in this directory for
instructions on running.
"""
from __future__ import print_function

import logging
import os
logging.basicConfig(level=logging.DEBUG)

from bokeh.appmaker import bokeh_app
from bokeh.models.ranges import DataRange1d
from bokeh.plotting import figure

from os import listdir
from os.path import dirname, join, splitext

import numpy as np
import pandas as pd


here = os.path.dirname(os.path.abspath(__file__))

# build up list of stock data in the daily folder
data_dir = join(here, "daily")
try:
    tickers = os.listdir(data_dir)
except OSError as e:
    print('Stock data not available, see README for download instructions.')
    raise e
tickers = [splitext(x)[0].split("table_")[-1] for x in tickers]

# cache stock data as dict of pandas DataFrames
pd_cache = {}

def get_ticker_data(ticker, label):
    fname = join(data_dir, "table_%s.csv" % ticker.lower())
    data = pd.read_csv(fname,
        names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'],
        header=False, parse_dates=['date']
    )
    data = data.set_index('date')
    data[label] = data.c
    data['date'] = data.index
    data[label + "_returns"] = data.c.diff()

    return data

def get_data(ticker1, ticker2):
    if pd_cache.get((ticker1, ticker2)) is not None:
        return pd_cache.get((ticker1, ticker2))

    # only append columns if it is the same ticker
    if ticker1 != ticker2:
        data1 = get_ticker_data(ticker1, 'x')
        data2 = get_ticker_data(ticker2, 'y')
        data = pd.concat([data1, data2], axis=1)

    else:
        data = get_ticker_data(ticker1, 'x')
        data['y'] = data['x']
        data['y_returns'] = data['x_returns']

    data = data.dropna()
    pd_cache[(ticker1, ticker2)] = data
    return data

def new_hist(title="Histogram"):
    return figure(title=title, plot_width=500, plot_height=200, tools="")

def make_hist_plot(p, df, ticker, selected_df=None):
    if selected_df is None:
        selected_df = df

    global_hist, global_bins = np.histogram(df[ticker + "_returns"], bins=50)
    hist, bins = np.histogram(selected_df[ticker + "_returns"], bins=50)
    width = 0.7 * (bins[1] - bins[0])
    center = (bins[:-1] + bins[1:]) / 2
    start = global_bins.min()
    end = global_bins.max()
    top = hist.max()

    p.x_range = DataRange1d(start=start, end=end)
    p.y_range = DataRange1d(start=0, end=top)

    p.rect(center, hist / 2.0, width, hist)
    return p

def update_data(app):
    objs = app._app.lazy_eval(app.objects, app.objects)

    ticker1 = objs['ticker1'].value
    ticker2 = objs['ticker2'].value
    statstext = objs['statstext']

    source = app.select_one({'tags': 'main_source'})
    df = get_data(ticker1, ticker2)
    source.data = df.to_dict(orient='list')
    statstext.text = str(df.describe())

    return {
        'statstext': statstext,
        'hist1': make_hist_plot(
            new_hist('%s Histogram' % ticker1), df, 'x'
        ),
        'hist2': make_hist_plot(
            new_hist('%s Histogram' % ticker2), df, 'y'
        )
    }

# def s_update_selection(app):
#     source = app.select_one({'tags' : 'main_source'})
#     df = get_data(ticker1, ticker2)
#     if source.selected:
#         selected_df = df.iloc[source.selected['1d']['indices'], :]
#     else:
#         selected_df = df
#
#     stats_text = app.objects['statstext']
#     stats_text.text = str(selected_df.describe())
#     return {
#         'hist1': hist_plot(df, ticker1, selected_df=selected_df),
#         'hist2': hist_plot(df, ticker2, selected_df=selected_df),
#         'statstext': stats_text,
#     }

TICKER1, TICKER2 = 'AAPL', 'GOOG'
app = bokeh_app(os.path.join(here, 'stocks.yaml'), route='/stocks/',
                handler=update_data,
                theme=os.path.join(here, 'style.yaml'))
selected_df = get_data(TICKER1, TICKER2)
app.sources['main_source'].data = selected_df.to_dict(orient='list')
app.objects['hist1'] = make_hist_plot(
    new_hist('%s Histogram' % TICKER1), selected_df, 'x')
app.objects['hist2'] = make_hist_plot(
    new_hist('%s Histogram' % TICKER2), selected_df, 'y')