import os
from os.path import join, dirname, splitext
import logging

import pandas as pd

import bokeh.server
from bokeh.server.app import bokeh_app
from bokeh.server.utils.plugins import object_page
from bokeh.plotting import line, circle, rect, curdoc
from bokeh.objects import Range1d
from bokeh.widgetobjects import (HBox, VBox, VBoxForm,
                                 TextInput, PreText,
                                 Select)
from bokeh.objects import Plot, ColumnDataSource
from bokeh.properties import (Dict, Float, String, Instance)
import numpy as np


logging.basicConfig(level=logging.DEBUG)
"""
This is an example applet run from the bokeh server.  you will need to download some sample data from quantquote, which
can be executed from the download.py script

Then, execute bokeh-server --script stock_example.py, and point your browser at http://localhost:5006/bokeh/stocks/
"""

data_dir = join(dirname(__file__), "daily")
tickers = os.listdir(data_dir)
tickers = [splitext(x)[0].split("table_")[-1] for x in tickers]

def get_ticker_data(ticker):
    fname = join(data_dir, "table_%s.csv" % ticker.lower())
    data = pd.read_csv(fname,
                        names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'],
                        header=False,
                        parse_dates=['date'])
    data = data.set_index('date')
    data = pd.DataFrame({ticker : data.c, ticker + "_returns" : data.c.diff()})
    return data

pd_cache = {}

def get_data(ticker1, ticker2):
    if pd_cache.get((ticker1, ticker2)) is not None:
        return pd_cache.get((ticker1, ticker2))
    data1 = get_ticker_data(ticker1)
    data2 = get_ticker_data(ticker2)
    data = pd.concat([data1, data2], axis=1)
    data = data.dropna()
    pd_cache[(ticker1, ticker2)]= data
    return data

class StockApp(VBox):
    extra_generated_classes = [["StockApp", "StockApp", "VBox"]]
    jsmodel = "VBox"

    #text statistics
    pretext = Instance(PreText)

    #plots
    plot = Instance(Plot)
    line_plot1 = Instance(Plot)
    line_plot2 = Instance(Plot)
    hist1 = Instance(Plot)
    hist2 = Instance(Plot)

    #datsource
    source = Instance(ColumnDataSource)

    #layout boxes
    mainrow = Instance(HBox)
    histrow = Instance(HBox)
    statsbox = Instance(VBox)

    #inputs
    ticker1 = String(default="AAPL")
    ticker2 = String(default="GOOG")
    ticker1_select = Instance(Select)
    ticker2_select = Instance(Select)
    input_box = Instance(VBoxForm)

    def __init__(self, *args, **kwargs):
        super(StockApp, self).__init__(*args, **kwargs)
        self._dfs = {}

    @classmethod
    def create(cls):
        """
        This function is called once, and is responsible for
        creating all objects (plots, datasources, etc)
        """
        #create layout widgets
        obj = cls()
        obj.mainrow = HBox()
        obj.histrow = HBox()
        obj.statsbox = VBox()
        obj.input_box = VBoxForm()

        #create input widgets
        obj.make_inputs()

        #outputs
        obj.pretext = PreText(text="", width=500)
        obj.make_source()
        obj.make_plots()
        obj.make_stats()

        #layout
        obj.set_children()
        return obj
    def make_inputs(self):
        self.ticker1_select = Select(name='ticker1',
                                     value='AAPL',
                                     options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
        )
        self.ticker2_select = Select(name='ticker2',
                                     value='GOOG',
                                     options=['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']
        )
    @property
    def selected_df(self):
        pandas_df = self.df
        selected = self.source.selected
        if selected:
            pandas_df = pandas_df.iloc[selected, :]
        return pandas_df

    def make_source(self):
        self.source = ColumnDataSource(data=self.df)

    def line_plot(self, ticker, x_range=None):
        plot = circle('date', ticker,
                      title=ticker,
                      size=2,
                      x_range=x_range,
                      x_axis_type='datetime',
                      source=self.source,
                      title_text_font_size="10pt",
                      plot_width=1000, plot_height=200,
                      nonselection_alpha=0.02,
                      tools="pan,wheel_zoom,select")
        return plot

    def hist_plot(self, ticker):
        global_hist, global_bins = np.histogram(self.df[ticker + "_returns"], bins=50)
        hist, bins = np.histogram(self.selected_df[ticker + "_returns"], bins=50)
        width = 0.7 * (bins[1] - bins[0])
        center = (bins[:-1] + bins[1:]) / 2
        start = global_bins.min()
        end = global_bins.max()
        top = hist.max()
        return rect(center, hist/2.0, width, hist,
                    title="%s hist" % ticker,
                    plot_width=500, plot_height=200,
                    tools="",
                    title_text_font_size="10pt",
                    x_range=Range1d(start=start, end=end),
                    y_range=Range1d(start=0, end=top))

    def make_plots(self):
        ticker1 = self.ticker1
        ticker2 = self.ticker2
        self.plot = circle(ticker1 + "_returns", ticker2 + "_returns",
                           size=2,
                           title="%s vs %s" %(ticker1, ticker2),
                           source=self.source,
                           plot_width=400, plot_height=400,
                           tools="pan,wheel_zoom,select",
                           title_text_font_size="10pt",
                           nonselection_alpha=0.02
        )
        self.line_plot1 = self.line_plot(ticker1)
        self.line_plot2 = self.line_plot(ticker2, self.line_plot1.x_range)
        self.hist_plots()

    def hist_plots(self):
        ticker1 = self.ticker1
        ticker2 = self.ticker2
        self.hist1 = self.hist_plot(ticker1)
        self.hist2 = self.hist_plot(ticker2)

    def set_children(self):
        self.children = [self.mainrow, self.histrow, self.line_plot1, self.line_plot2]
        self.mainrow.children = [self.input_box, self.plot, self.statsbox]
        self.input_box.children = [self.ticker1_select, self.ticker2_select]
        self.histrow.children = [self.hist1, self.hist2]
        self.statsbox.children = [self.pretext]

    def input_change(self, obj, attrname, old, new):
        if obj == self.ticker2_select:
            self.ticker2 = new
        if obj == self.ticker1_select:
            self.ticker1 = new
        self.make_source()
        self.make_plots()
        self.set_children()
        curdoc().add(self)

    def setup_events(self):
        super(StockApp, self).setup_events()
        if self.source:
            self.source.on_change('selected', self, 'selection_change')
        if self.ticker1_select:
            self.ticker1_select.on_change('value', self, 'input_change')
        if self.ticker2_select:
            self.ticker2_select.on_change('value', self, 'input_change')

    def make_stats(self):
        stats = self.selected_df.describe()
        self.pretext.text = str(stats)

    def selection_change(self, obj, attrname, old, new):
        self.make_stats()
        self.hist_plots()
        self.set_children()
        curdoc().add(self)

    @property
    def df(self):
        return get_data(self.ticker1, self.ticker2)

@bokeh_app.route("/bokeh/stocks/")
@object_page("stocks")
def make_object():
    app = StockApp.create()
    return app

# the following addes "/exampleapp" as a url which renders StockApp
