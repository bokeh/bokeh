"""
This file demonstrates a bokeh applet, which can either be viewed
directly on a bokeh-server, or embedded into a flask application.
See the README.md file in this directory for instructions on running.
"""

import logging

logging.basicConfig(level=logging.DEBUG)

from os import listdir
from os.path import dirname, join, splitext

import numpy as np
import pandas as pd

from bokeh.models import ColumnDataSource, Plot
from bokeh.plotting import Figure
from bokeh.properties import String, Instance
from bokeh.server.app import bokeh_app
from bokeh.models.widgets import HBox, VBox, VBoxForm, PreText, Select

from bokeh.io import curdoc

# build up list of stock data in the daily folder
# data_dir = join(dirname(__file__), "daily")
data_dir = join('./examples/app/stock_applet', "daily")
try:
    tickers = listdir(data_dir)
except OSError as e:
    print('Stock data not available, see README for download instructions.')
    raise e
tickers = [splitext(x)[0].split("table_")[-1] for x in tickers]

# cache stock data as dict of pandas DataFrames
pd_cache = {}


def get_ticker_data(ticker):
    fname = join(data_dir, "table_%s.csv" % ticker.lower())
    data = pd.read_csv(
        fname,
        names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'],
        header=None,
        parse_dates=['date']
    )
    data = data.set_index('date')
    data = pd.DataFrame({ticker: data.c, ticker + "_returns": data.c.diff()})
    return data


def get_data(ticker1, ticker2, alias1='stock1', alias2='stock2'):
    if pd_cache.get((ticker1, ticker2)) is not None:
        return pd_cache.get((ticker1, ticker2))

    # only append columns if it is the same ticker
    if ticker1 != ticker2:
        data1 = get_ticker_data(ticker1)
        data2 = get_ticker_data(ticker2)
        data = pd.concat([data1, data2], axis=1)
        data[alias1] = data.pop(ticker1)
        data["%s_returns" % alias1] = data.pop("%s_returns" % ticker1)
        data[alias2] = data.pop(ticker2)
        data["%s_returns" % alias2] = data.pop("%s_returns" % ticker2)
    else:
        data = get_ticker_data(ticker1)
        data[alias2] = data[alias1] = data.pop(ticker1)
        data["%s_returns" % alias2] = data["%s_returns" % alias1] = data.pop("%s_returns" % ticker1)

    data = data.dropna()
    pd_cache[(ticker1, ticker2)] = data
    return data

# # create input widgets
TICKER_VALUES = ['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
ticker1 = "AAPL"
ticker2 = "GOOG"
ticker1_select = Select(name='ticker1',value=ticker1,options=TICKER_VALUES)
ticker2_select = Select(name='ticker2',value=ticker2,options=TICKER_VALUES)

# # outputs
pretext = PreText(text="", width=500)



source = ColumnDataSource()
h1source = ColumnDataSource()
h2source = ColumnDataSource()

def update_data():
    data = get_data(ticker1, ticker2)
    source.data = {
        'date': data.index,
        'stock1': data['stock1'],
        'stock1_returns': data['stock1_returns'],
        'stock2': data['stock2'],
        'stock2_returns': data['stock2_returns']
    }
    return data

df = update_data()

def line_plot(ticker, alias, x_range=None):
    p = Figure(
        title=alias, x_range=x_range, x_axis_type='datetime',
        plot_width=1000, plot_height=200, title_text_font_size="10pt",
        tools="pan,wheel_zoom,box_select,reset"
    )
    p.circle('date', ticker, size=2, source=source, nonselection_alpha=0.02)
    return p

def hist_plot(ticker, alias, hsource, df, plot=None, selected_df=None):
    if selected_df is None:
        selected_df = df

    global_hist, global_bins = np.histogram(df[ticker + "_returns"], bins=50)
    hist, bins = np.histogram(selected_df[ticker + "_returns"], bins=50)

    top = hist.max()
    start = global_bins.min()
    end = global_bins.max()
    width = 0.7 * (bins[1] - bins[0])
    hdata = dict(
        width = [width] * len(hist),
        center = (bins[:-1] + bins[1:]) / 2,
        hist2 = hist / 2.0,
        hist = hist
    )
    hsource.data = hdata

    if plot is None:
        plot = Figure(
            plot_width=500, plot_height=200,
            tools="",
            title_text_font_size="10pt",
            x_range=[start, end],
            y_range=[0, top],
        )
        plot.rect('center', 'hist2', 'width', 'hist', source=hsource)

    plot.x_range.start = start
    plot.x_range.end = end
    plot.y_range.start = 0
    plot.y_range.end = top
    plot.title = "%s hist" % alias
    return plot

p = Figure(
    title="%s vs %s" % (ticker1, ticker2),
    plot_width=400, plot_height=400,
    tools="pan,wheel_zoom,box_select,reset",
    title_text_font_size="10pt",
)
p.circle("stock1_returns", "stock2_returns", size=2, nonselection_alpha=0.02, source=source)
plot = p

line_plot1 = line_plot('stock1', ticker1)
line_plot2 = line_plot('stock2', ticker2, line_plot1.x_range)

hist1 = hist_plot('stock1', ticker1, h1source, df)
hist2 = hist_plot('stock2', ticker2, h2source, df)

# These 2 handlers functions could be turned into a single factory
# but the current implementation is probably more readable
def input1_change(attrname, old, new):
    global ticker1

    ticker1 = new
    update_plots()

def input2_change(attrname, old, new):
    global ticker2

    ticker2 = new
    update_plots()

def update_plots():
    data = update_data()
    hist_plot('stock1', ticker1, h1source, data, plot=hist1)
    hist_plot('stock2', ticker2, h2source, data, plot=hist2)

    plot.title = '%s vs %s' % (ticker1, ticker2)
    line_plot1.title = ticker1
    line_plot2.title = ticker2

def selection_change(attrname, old, new):
    df = get_data(ticker1, ticker2)
    if source.selected['1d']['indices']:
        selected_df = df.iloc[source.selected['1d']['indices'], :]
    else:
        selected_df = None

    hist_plot('stock1', ticker1, h1source, df, plot=hist1, selected_df=selected_df)
    hist_plot('stock2', ticker2, h2source, df, plot=hist2, selected_df=selected_df)

ticker1_select.on_change('value', input1_change)
ticker2_select.on_change('value', input2_change)
source.on_change('selected', selection_change)

# layout
statsbox = VBox(children=[pretext])
input_box = VBox(children=[ticker1_select, ticker2_select])
mainrow = HBox(children=[input_box, plot, statsbox])
histrow = HBox(children=[hist1, hist2])
vbox = VBox(children=[mainrow, histrow, line_plot1, line_plot2])

curdoc().add(vbox)
