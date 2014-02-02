
import numpy as np

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import *

output_server("stocks")

hold()

line(np.array(AAPL['date'], dtype=np.datetime64), AAPL['adj_close'],
     x_axis_type = "datetime",
     color='#A6CEE3', tools="pan,wheel_zoom,resize",
     legend='AAPL')
line(np.array(FB['date'], dtype=np.datetime64), FB['adj_close'],
     color='#1F78B4', tools="pan,wheel_zoom,resize",
     legend='FB')
line(np.array(GOOG['date'], dtype=np.datetime64), GOOG['adj_close'],
     color='#B2DF8A', tools="pan,wheel_zoom,resize",
     legend='GOOG')
line(np.array(IBM['date'], dtype=np.datetime64), IBM['adj_close'],
     color='#33A02C', tools="pan,wheel_zoom,resize",
     legend='IBM')
line(np.array(MSFT['date'], dtype=np.datetime64), MSFT['adj_close'],
     color='#FB9A99', tools="pan,wheel_zoom,resize",
     legend='MSFT')

curplot().title = "Stock Closing Prices"
grid().grid_line_alpha=0.3

figure()

aapl = np.array(AAPL['adj_close'])
aapl_dates = np.array(AAPL['date'], dtype=np.datetime64)

window_size = 30
window = np.ones(window_size)/float(window_size)
aapl_avg = np.convolve(aapl, window, 'same')

scatter(aapl_dates, aapl,
        x_axis_type = "datetime",
        color='#A6CEE3', radius=1, tools="pan,wheel_zoom,resize", legend='close')
line(aapl_dates, aapl_avg,
     x_axis_type = "datetime",
     color='red', tools="pan,wheel_zoom,resize", legend='avg')

curplot().title = "AAPL One-Month Average"
grid().grid_line_alpha=0.3

show()

