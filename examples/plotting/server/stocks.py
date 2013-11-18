
import numpy as np

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import *


output_server("stocks.py examples")

hold()

line(np.array(AAPL['date'], dtype=np.datetime64).astype('int'), AAPL['adj_close'],
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,zoom,resize",
     legend='AAPL')
line(np.array(FB['date'], dtype=np.datetime64).astype('int'), FB['adj_close'],
     color='#1F78B4', tools="pan,zoom,resize",
     legend='FB')
line(np.array(GOOG['date'], dtype=np.datetime64).astype('int'), GOOG['adj_close'],
      olor='#B2DF8A', tools="pan,zoom,resize",
     legend='GOOG')
line(np.array(IBM['date'], dtype=np.datetime64).astype('int'), IBM['adj_close'],
     color='#33A02C', tools="pan,zoom,resize",
     legend='IBM')
line(np.array(MSFT['date'], dtype=np.datetime64).astype('int'), MSFT['adj_close'],
     color='#FB9A99', tools="pan,zoom,resize",
     legend='MSFT')

curplot().title = "Stock Closing Prices"
grid().grid_line_alpha=0.3

figure()

aapl = np.array(AAPL['adj_close'])
aapl_dates = np.array(AAPL['date'], dtype=np.datetime64).astype('int')

window_size = 30
window = np.ones(window_size)/float(window_size)
aapl_avg = np.convolve(aapl, window, 'same')

scatter(aapl_dates, aapl,
        x_axis_type = "datetime",
        color='#A6CEE3', radius=1, tools="pan,zoom,resize", legend='close')
line(aapl_dates, aapl_avg,
     color='red', tools="pan,zoom,resize", legend='avg')

curplot().title = "AAPL One-Month Average"
grid().grid_line_alpha=0.3

show()

