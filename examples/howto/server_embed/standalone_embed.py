import numpy as np
from tornado.ioloop import IOLoop

from bokeh.application.handlers import FunctionHandler
from bokeh.application import Application
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Slider
from bokeh.plotting import figure
from bokeh.server.server import Server

io_loop = IOLoop.current()

def modify_doc(doc):
    x = np.linspace(0, 10, 1000)
    y = np.log(x) * np.sin(x)

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = figure()
    plot.line('x', 'y', source=source)

    slider = Slider(start=1, end=10, value=1, step=0.1)

    def callback(attr, old, new):
        y = np.log(x) * np.sin(x*new)
        source.data = dict(x=x, y=y)
    slider.on_change('value', callback)

    doc.add_root(column(slider, plot))

bokeh_app = Application(FunctionHandler(modify_doc))

server = Server({'/': bokeh_app}, io_loop=io_loop)
server.start()

if __name__ == '__main__':
    print('Opening Bokeh application on http://localhost:5006/')

    io_loop.add_callback(server.show, "/")
    io_loop.start()
