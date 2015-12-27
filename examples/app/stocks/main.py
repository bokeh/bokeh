''' Create a simple stocks correlation dashboard.

Choose stocks to compare in the drop down widgets, and make selections
on the plots to update the summary and histograms accordingly.

.. note::
    Running this example requires downloading sample data. See
    the included `README`_ for more information.

Use the ``bokeh serve`` command to run the example by executing:

    bokeh serve stocks

at your command prompt. Then navigate to the URL

    http://localhost:5006/stocks

.. _README: https://github.com/bokeh/bokeh/blob/master/examples/app/stocks/README.md

'''
from functools import lru_cache
from os.path import dirname, join

import pandas as pd

from bokeh.charts import Histogram
from bokeh.models import ColumnDataSource
from bokeh.plotting import Figure
from bokeh.models.widgets import HBox, VBox, PreText, Select

from bokeh.io import curdoc

DATA_DIR = join(dirname(__file__), 'daily')

DEFAULT_TICKERS = ['AAPL', 'GOOG', 'INTC', 'BRCM', 'YHOO']

def nix(val, lst):
    return [x for x in lst if x != val]

@lru_cache()
def load_ticker(ticker):
    fname = join(DATA_DIR, 'table_%s.csv' % ticker.lower())
    data = pd.read_csv(fname, header=None, parse_dates=['date'],
                       names=['date', 'foo', 'o', 'h', 'l', 'c', 'v'])
    data = data.set_index('date')
    return pd.DataFrame({ticker: data.c, ticker+'_returns': data.c.diff()})

@lru_cache()
def get_data(t1, t2):
    df1 = load_ticker(t1)
    df2 = load_ticker(t2)
    data = pd.concat([df1, df2], axis=1)
    data = data.dropna()
    data['t1'] = data[t1]
    data['t2'] = data[t2]
    data['t1_returns'] = data[t1+'_returns']
    data['t2_returns'] = data[t2+'_returns']
    return data

@lru_cache()
def get_histogram(t):
    t1, t2 = ticker1.value, ticker2.value
    data = get_data(t1, t2)
    h = Histogram(data[[t]], values=t)
    h.toolbar_location = None
    return h

# set up widgets

stats = PreText(text='', width=550)
ticker1 = Select(value='AAPL', options=nix('GOOG', DEFAULT_TICKERS))
ticker2 = Select(value='GOOG', options=nix('AAPL', DEFAULT_TICKERS))

# set up plots

source = ColumnDataSource(data=dict())
tools = 'pan,wheel_zoom,box_select,reset'

corr = Figure(plot_width=400, plot_height=400, title='',
              title_text_font_size='10pt', tools=tools)
corr.circle('t1_returns', 't2_returns', size=2, source=source)

ts1 = Figure(plot_width=800, plot_height=150, title='', tools=tools,
             x_axis_type='datetime', title_text_font_size='8pt')
ts1.circle('date', 't1', size=2, source=source)

ts2 = Figure(plot_width=800, plot_height=150, title='', tools=tools,
             x_axis_type='datetime', title_text_font_size='8pt')
ts2.x_range = ts1.x_range
ts2.circle('date', 't2', size=2, source=source)

# set up callbacks

def ticker1_change(attrname, old, new):
    ticker2.options = nix(new, DEFAULT_TICKERS)
    update()

def ticker2_change(attrname, old, new):
    ticker1.options = nix(new, DEFAULT_TICKERS)
    update()

def update(selected=None):
    t1, t2 = ticker1.value, ticker2.value

    data = get_data(t1, t2)
    source.data = source.from_df(data[['t1', 't2', 't1_returns', 't2_returns']])

    update_stats_and_histograms(data, t1, t2)

    corr.title = '%s returns vs. %s returns' % (t1, t2)
    ts1.title, ts2.title = t1, t2

def update_stats_and_histograms(data, t1, t2):
    stats.text = str(data[[t1, t2, t1+'_returns', t2+'_returns']].describe())

    global layout
    h1 = get_histogram(t1)
    h2 = get_histogram(t2)
    layout.children[1] = HBox(h1, h2)

ticker1.on_change('value', ticker1_change)
ticker2.on_change('value', ticker2_change)

def selection_change(attrname, old, new):
    t1, t2 = ticker1.value, ticker2.value
    data = get_data(t1, t2)
    selected = source.selected['1d']['indices']
    if selected:
        data = data.iloc[selected, :]
    update_stats_and_histograms(data, t1, t2)

source.on_change('selected', selection_change)

# set up layout
stats_box = VBox(stats)
input_box = VBox(ticker1, ticker2)
main_row = HBox(input_box, corr, stats_box)
layout = VBox(main_row, HBox(), ts1, ts2)

# initialize
update()

curdoc().add_root(layout)
