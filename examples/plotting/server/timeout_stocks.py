# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np

from bokeh.sampledata.stocks import AAPL, FB, GOOG, IBM, MSFT
from bokeh.plotting import figure, curdoc, hplot
from bokeh.models.sources import ColumnDataSource
from bokeh.client import push_session

p1 = figure(x_axis_type = "datetime")

renderers = {}
renderers['AAPL'] = p1.line(np.array(AAPL['date'], dtype=np.datetime64), AAPL['adj_close'], color='#A6CEE3', line_width = 1, legend='AAPL')
renderers['FB'] = p1.line(np.array(FB['date'], dtype=np.datetime64), FB['adj_close'], color='#1F78B4', legend='FB')
renderers['GOOG'] = p1.line(np.array(GOOG['date'], dtype=np.datetime64), GOOG['adj_close'], color='#B2DF8A', legend='GOOG')
renderers['IBM'] = p1.line(np.array(IBM['date'], dtype=np.datetime64), IBM['adj_close'], color='#33A02C', legend='IBM')
renderers['MSFT'] = p1.line(np.array(MSFT['date'], dtype=np.datetime64), MSFT['adj_close'], color='#FB9A99', legend='MSFT')

p1.title = "Stock Closing Prices"
p1.grid.grid_line_alpha=0.3
p1.xaxis.axis_label = 'Date'
p1.yaxis.axis_label = 'Price'

aapl = np.array(AAPL['adj_close'])
aapl_dates = np.array(AAPL['date'], dtype=np.datetime64)

window_size = 30
window = np.ones(window_size)/float(window_size)
aapl_avg = np.convolve(aapl, window, 'same')

cds = ColumnDataSource(
    {'dates': np.array(AAPL['date'], dtype=np.datetime64), 'adj_close': AAPL['adj_close'],
    'avg': aapl_avg}
    )
p2 = figure(x_axis_type="datetime")

p2.circle('dates', 'adj_close', size=4, color='darkgrey', alpha=0.2, legend='close', source=cds)
p2.line('dates', 'avg', color='navy', legend='avg', source=cds)

p2.title = "AAPL One-Month Average"
p2.grid.grid_line_alpha=0
p2.xaxis.axis_label = 'Date'
p2.yaxis.axis_label = 'Price'
p2.ygrid.band_fill_color="olive"
p2.ygrid.band_fill_alpha = 0.1

# Open a session which will keep our local doc in sync with server
session = push_session(curdoc())
# Open the session in a browser
layout = hplot(p1,p2)
session.show(layout)

def get_change_datasource_cb(data, stockname):
    def cb():
        cds.data['adj_close'] = data['adj_close']
        cds.data['avg'] = np.convolve(np.array(data['adj_close']), window, 'same')
        cds.data['date'] = np.array(data['date'], dtype=np.datetime64)
        p2.title = "%s One-Month Average" % stockname

        for k, r in renderers.items():
            if k == stockname:
                r.glyph.line_width = 3
            else:
                r.glyph.line_width = 1

    return cb

def register_callbacks():
    for i, (callback, stockname) in enumerate([(FB, 'FB'), (GOOG, 'GOOG'), (IBM, 'IBM'), (MSFT, 'MSFT'), (AAPL, 'AAPL')]):
        cb = get_change_datasource_cb(callback, stockname)
        curdoc().add_timeout_callback(cb, (i+1)*5)



register_callbacks()

# Start the session loop
session.loop_until_closed()
