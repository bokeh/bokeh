""" Create a simple stocks correlation dashboard.

Choose stocks to compare in the drop down widgets, and make selections
on the plots to update the summary and histograms accordingly.

Use the ``bokeh serve`` command to run the example by executing:

    bokeh serve stocks

at your command prompt. Then navigate to the URL

    http://localhost:5006/stocks

"""
from functools import lru_cache

from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, PreText, Select
from bokeh.plotting import curdoc, figure

DEFAULT_TICKERS = ["AAPL", "GOOG", "INTC", "NVDA", "MSFT"]

SERVER_CONTEXT = curdoc().session_context.server_context

def nix(val, lst):
    return [x for x in lst if x != val]

@lru_cache
def get_data(t1, t2):
    df1 = getattr(SERVER_CONTEXT, t1)
    df2 = getattr(SERVER_CONTEXT, t2)
    data = df1.join(df2, lsuffix=f"_{t1}", rsuffix=f"_{t2}").dropna()
    data["t1"] = data[f"Close_{t1}"]
    data["t2"] = data[f"Close_{t2}"]
    data["t1_returns"] = data[f"Returns_{t1}"]
    data["t2_returns"] = data[f"Returns_{t2}"]
    return data

source = ColumnDataSource(data=dict(date=[], t1=[], t2=[], t1_returns=[], t2_returns=[]))
source_static = ColumnDataSource(data=dict(date=[], t1=[], t2=[], t1_returns=[], t2_returns=[]))

corr = figure(width=370, height=350,  min_border_left=60,
              tools="pan,wheel_zoom,box_select,reset", active_drag="box_select")
corr.scatter("t1_returns", "t2_returns", size=3, source=source,
             selection_color="orange", alpha=0.8,
             nonselection_alpha=0.1, selection_alpha=0.5)

ts1 = figure(width=900, height=200, x_axis_type="datetime",
             tools="pan,wheel_zoom,xbox_select,reset", active_drag="xbox_select")
ts1.line("Date", "t1", source=source_static)
ts1.scatter("Date", "t1", size=3, source=source, color=None, selection_color="orange")

ts2 = figure(width=900, height=200, x_axis_type="datetime",
             tools="pan,wheel_zoom,xbox_select,reset", active_drag="xbox_select")
ts2.line("Date", "t2", source=source_static)
ts2.scatter("Date", "t2", size=3, source=source, color=None, selection_color="orange")

ts2.x_range = ts1.x_range

stats = PreText(text="", width=500)

ticker1 = Select(value="AAPL", options=nix("GOOG", DEFAULT_TICKERS))
def ticker1_change(attrname, old, new):
    ticker2.options = nix(new, DEFAULT_TICKERS)
    update()
ticker1.on_change("value", ticker1_change)

ticker2 = Select(value="GOOG", options=nix("AAPL", DEFAULT_TICKERS))
def ticker2_change(attrname, old, new):
    ticker1.options = nix(new, DEFAULT_TICKERS)
    update()
ticker2.on_change("value", ticker2_change)

def update_stats(data, t1, t2):
    stats.text = str(data[[f"Close_{t1}", f"Close_{t2}", f"Returns_{t1}", f"Returns_{t1}"]].describe())

def update(selected=None):
    t1, t2 = ticker1.value, ticker2.value
    data = get_data(t1, t2)

    source.data = data
    source.selected.indices = []
    source_static.data = data
    corr.title.text = f"{t1} returns vs. {t2} returns"
    ts1.title.text, ts2.title.text = t1, t2

    update_stats(data, t1, t2)

def selection_change(attrname, old, new):
    t1, t2 = ticker1.value, ticker2.value
    data = get_data(t1, t2)

    if selected := source.selected.indices:
        data = data.iloc[selected, :]

    update_stats(data, t1, t2)

source.selected.on_change("indices", selection_change)

update()

widgets = column(row(ticker1, ticker2), stats)
main_row = row(corr, widgets)
series = column(ts1, ts2)

curdoc().add_root(column(main_row, series))
curdoc().title = "Stocks"
