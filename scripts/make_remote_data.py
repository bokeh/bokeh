from arraymanagement.client import ArrayClient
from os.path import abspath
from bokeh.sampledata import stocks
import pandas as pd
c = ArrayClient(abspath("../remotedata"), 
                configname="bokeh.server.hdf5_backend_config")

aapl = pd.DataFrame(stocks.AAPL)
fb = pd.DataFrame(stocks.FB)
goog = pd.DataFrame(stocks.GOOG)
msft = pd.DataFrame(stocks.MSFT)
aapl['date'] = aapl['date'].astype('datetime64[ns]')
fb['date'] = fb['date'].astype('datetime64[ns]')
goog['date'] = goog['date'].astype('datetime64[ns]')
msft['date'] = msft['date'].astype('datetime64[ns]')
c['defaultuser'].put('AAPL', aapl, format='table')
c['defaultuser'].put('MSFT', msft, format='table')
c['defaultuser'].put('GOOG', goog, format='table')
c['defaultuser'].put('FB', fb, format='table')

print c['/defaultuser/AAPL'].select()
print c['/defaultuser/MSFT'].select()
print c['/defaultuser/GOOG'].select()
print c['/defaultuser/FB'].select()

