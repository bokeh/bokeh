import pandas_datareader as web

TICKERS = ["AAPL", "GOOG", "INTC", "NVDA", "MSFT"]


def on_server_loaded(server_context):
    print("\nLoading data from Yahoo finance...", end="")

    for ticker in TICKERS:
        df = web.DataReader(ticker, "yahoo", start="2020-09-01", end="2022-09-01")
        df["Returns"] = df["Close"].diff()
        setattr(server_context, ticker, df)

    print("DONE!\n")
