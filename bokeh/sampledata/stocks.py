'''
This module provides some recorded stock data for the following stocks: AAPL, FB, GOOG, IBM, MSFT.
Each set of data is available as an attribute on the module (e.g., stocks.AAPL) and the value is
a dictionary with the structure:

    AAPL['date']       # list of date string
    AAPL['open']       # list of float
    AAPL['high']       # list of float
    AAPL['low']        # list of float
    AAPL['close']      # list of float
    AAPL['volume']     # list of int
    AAPL['adj_close']  # list of float

'''
from __future__ import absolute_import

import csv
from os.path import exists, isfile, join
import sys
from . import _data_dir
from . import _open_csv_file

def _load_stock(filename):
    data = {
        'date' : [],
        'open' : [],
        'high' : [],
        'low' : [],
        'close' : [],
        'volume' : [],
        'adj_close': [],
    }
    with _open_csv_file(filename) as f:
        next(f)
        reader = csv.reader(f, delimiter=',')
        for row in reader:
            date, open_price, high, low, close, volume, adj_close = row
            data['date'].append(date)
            data['open'].append(float(open_price))
            data['high'].append(float(high))
            data['low'].append(float(low))
            data['close'].append(float(close))
            data['volume'].append(int(volume))
            data['adj_close'].append(float(adj_close))
    return data

data_dir = _data_dir()

stocks = [
    'AAPL',
    'FB',
    'GOOG',
    'IBM',
    'MSFT',
]

for stock in stocks:
    filename = join(data_dir, stock + '.csv')
    if not exists(filename) and isfile(filename):
        raise RuntimeError('could not load stock data for %s, please execute bokeh.sampledata.download()')
    setattr(
        sys.modules[__name__],
        stock,
        _load_stock(filename)
    )

__all__ = stocks
