"""
This file demonstrates a bokeh applet, which can be viewed directly
on a bokeh-server. See the README.md file in this directory for
instructions on running.
"""
from __future__ import print_function

import logging
import os
logging.basicConfig(level=logging.DEBUG)

from bokeh.models.ranges import DataRange1d
from bokeh.plotting import figure

from os.path import dirname, join, splitext

import numpy as np
import pandas as pd
from bokeh.appmaker import load_from_yaml

here = os.path.dirname(os.path.abspath(__file__))

# build up list of stock data in the daily folder
data_dir = join(here, "daily")
try:
    tickers = os.listdir(data_dir)
except OSError as e:
    print('Stock data not available, see README for download instructions.')
    raise e
tickers = [splitext(x)[0].split("table_")[-1] for x in tickers]
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


def get_data(ticker1, ticker2, **kws):
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


def update_selection(app):
    vs = app._values

    themepath = join(here, 'dark.yaml' )
    app._app.theme = load_from_yaml(themepath)

    source = app.select_one({'tags' : 'main_source'})
    df = get_data(**vs)
    if source.selected['1d']['indices']:
        selected_df = df.iloc[source.selected['1d']['indices'], :]
    else:
        selected_df = df

    source.data = df.to_dict(orient='list')
    stats_text = app.objects['statstext']
    stats_text.text = str(df.describe())

    app.objects.update(
        {
        'statstext': stats_text,
        'hist1': make_hist_plot(new_hist('%s Histogram' % vs['ticker1']), df, 'x', selected_df),
        'hist2': make_hist_plot(new_hist('%s Histogram' % vs['ticker2']), df, 'y', selected_df)
    }
    )

    return app.objects

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