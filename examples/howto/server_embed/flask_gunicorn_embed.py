from flask import Flask, render_template

from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop

from bokeh.application import Application
from bokeh.application.handlers import FunctionHandler
from bokeh.embed import server_document
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Slider
from bokeh.plotting import figure
from bokeh.server.server import BaseServer
from bokeh.server.tornado import BokehTornado
from bokeh.server.util import bind_sockets
from bokeh.themes import Theme

if __name__ == '__main__':
    print('This script is intended to be run with gunicorn. e.g.')
    print()
    print('    gunicorn -w 4 flask_gunicorn_embed:app')
    print()
    print('will start the app on four processes')
    import sys
    sys.exit()

from bokeh.sampledata.sea_surface_temperature import sea_surface_temperature

app = Flask(__name__)

def modify_doc(doc):
    df = sea_surface_temperature.copy()
    source = ColumnDataSource(data=df)

    plot = figure(x_axis_type='datetime', y_range=(0, 25), y_axis_label='Temperature (Celsius)',
                  title="Sea Surface Temperature at 43.18, -70.43")
    plot.line('time', 'temperature', source=source)

    def callback(attr, old, new):
        if new == 0:
            data = df
        else:
            data = df.rolling('{0}D'.format(new)).mean()
        source.data = ColumnDataSource(data=data).data

    slider = Slider(start=0, end=30, value=0, step=1, title="Smoothing by N Days")
    slider.on_change('value', callback)

    doc.add_root(column(slider, plot))

    doc.theme = Theme(filename="theme.yaml")

# can't use shortcuts here, since we are passing to low level BokehTornado
bkapp = Application(FunctionHandler(modify_doc))

bokeh_tornado = BokehTornado({'/bkapp': bkapp}, extra_websocket_origins=["localhost:8000"])
bokeh_http = HTTPServer(bokeh_tornado)

# This is so that if this app is run using something like "gunicorn -w 4" then
# each process will listen on its own port
sockets, port = bind_sockets("localhost", 0)
bokeh_http.add_sockets(sockets)

@app.route('/', methods=['GET'])
def bkapp_page():
    script = server_document('http://localhost:%d/bkapp' % port)
    return render_template("embed.html", script=script, template="Flask")

def bk_worker():
    io_loop = IOLoop.current()
    server = BaseServer(io_loop, bokeh_tornado, bokeh_http)
    server.start()
    server.io_loop.start()

from threading import Thread
Thread(target=bk_worker).start()
