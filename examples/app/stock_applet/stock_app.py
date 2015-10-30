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


def get_data(ticker1, ticker2):
    if pd_cache.get((ticker1, ticker2)) is not None:
        return pd_cache.get((ticker1, ticker2))

    # only append columns if it is the same ticker
    if ticker1 != ticker2:
        data1 = get_ticker_data(ticker1)
        data2 = get_ticker_data(ticker2)
        data = pd.concat([data1, data2], axis=1)
    else:
        data = get_ticker_data(ticker1)

    data = data.dropna()
    pd_cache[(ticker1, ticker2)] = data
    return data


# # create input widgets
ticker1_select = Select(
    name='ticker1',
    value='AAPL',
    options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
)
ticker2_select = Select(
    name='ticker2',
    value='GOOG',
    options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
)
#
# # outputs
pretext = PreText(text="", width=500)

ticker1 = "AAPL"
ticker2 = "GOOG"
df = get_data(ticker1, ticker2)
source = ColumnDataSource(data=df)

def line_plot(ticker, x_range=None):
    p = Figure(
        title=ticker,
        x_range=x_range,
        x_axis_type='datetime',
        plot_width=1000, plot_height=200,
        title_text_font_size="10pt",
        tools="pan,wheel_zoom,box_select,reset"
    )
    p.circle(
        'date', ticker,
        size=2,
        source=source,
        nonselection_alpha=0.02
    )
    return p

def hist_plot(ticker):
    df = get_data(ticker1, ticker2)

    selected_df = df

    global_hist, global_bins = np.histogram(df[ticker + "_returns"], bins=50)
    hist, bins = np.histogram(selected_df[ticker + "_returns"], bins=50)
    width = 0.7 * (bins[1] - bins[0])
    center = (bins[:-1] + bins[1:]) / 2
    start = global_bins.min()
    end = global_bins.max()
    top = hist.max()

    p = Figure(
        title="%s hist" % ticker,
        plot_width=500, plot_height=200,
        tools="",
        title_text_font_size="10pt",
        x_range=[start, end],
        y_range=[0, top],
    )
    p.rect(center, hist / 2.0, width, hist)
    return p

p = Figure(
    title="%s vs %s" % (ticker1, ticker2),
    plot_width=400, plot_height=400,
    tools="pan,wheel_zoom,box_select,reset",
    title_text_font_size="10pt",
)
p.circle(ticker1 + "_returns", ticker2 + "_returns",
         size=2,
         nonselection_alpha=0.02,
         source=source
)
plot = p

line_plot1 = line_plot(ticker1)
line_plot2 = line_plot(ticker2, line_plot1.x_range)

hist1 = hist_plot(ticker1)
hist2 = hist_plot(ticker2)

# layout
statsbox = VBox(children=[pretext])
input_box = VBox(children=[ticker1_select, ticker2_select])

mainrow = HBox(children=[input_box, plot, statsbox])
histrow = HBox(children=[hist1, hist2])

vbox = VBox(children=[mainrow, histrow, line_plot1, line_plot2])

def input1_change(attrname, old, new):
    print ("change source here...", attrname, old, new)
    # if obj == self.ticker2_select:
    #     self.ticker2 = new
    # if obj == self.ticker1_select:
    #     self.ticker1 = new
    #
    # self.make_source()
    # self.make_plots()
    # self.set_children()
    # curdoc().add(self)

def input2_change(attrname, old, new):
    print ("change source here 2...", attrname, old, new)

def selection_change(attrname, old, new):
    print ("SELECTION CHANGED")
    # self.make_stats()
    # self.hist_plots()
    # self.set_children()
    # curdoc().add(self)

ticker1_select.on_change('value', input1_change)
ticker2_select.on_change('value', input2_change)

source.on_change('selected', selection_change)
curdoc().add(vbox)
