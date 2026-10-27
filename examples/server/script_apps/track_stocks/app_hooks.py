import pandas as pd

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT

PRICES = {"AAPL": AAPL, "GOOG": GOOG, "IBM": IBM, "FB": FB, "MSFT": MSFT}


def on_server_loaded(server_context):
    for ticker, prices in PRICES.items():
        frame = pd.DataFrame(prices)
        frame["Date"] = pd.to_datetime(frame.pop("date"))
        frame = frame.set_index("Date").rename(columns={"close": "Close"})
        frame["Returns"] = frame["Close"].diff()
        setattr(server_context, ticker, frame)
