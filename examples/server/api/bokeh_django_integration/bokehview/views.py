from django.shortcuts import render
from tornado.ioloop import IOLoop
from threading import Thread
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Slider
from bokeh.plotting import figure
from bokeh.sampledata.sea_surface_temperature import sea_surface_temperature
from bokeh.server.server import Server
from bokeh.themes import Theme
from bokeh.embed import server_document
import socket, errno


def home(request):
    # example bokeh dashboard with python callbacks
    def bkapp(doc):
        df = sea_surface_temperature.copy()
        source = ColumnDataSource(data=df)

        plot = figure(x_axis_type='datetime', y_range=(0, 25), y_axis_label='Temperature (Celsius)',
                    title="Sea Surface Temperature at 43.18, -70.43")
        plot.line('time', 'temperature', source=source)

        # load the request arguments from the server_document argument
        request_token = doc.session_context.request.arguments

        def callback(attr, old, new):
            if new == 0:
                data = df
            else:
                data = df.rolling(f"{new}D").mean()
            source.data = ColumnDataSource.from_df(data)    

        # dummy example to use the argument in bokeh server.
        if request_token['auth'][0] == b'WW':
            slider = Slider(start=0, end=30, value=0, step=1, title="Smoothing by N Days")
            slider.on_change('value', callback)
            doc.add_root(column(slider, plot))
        else:
            doc.add_root(column(plot))
    
    # create the worker
    def bk_worker():
        server = Server({'/bkapp': bkapp}, io_loop=IOLoop(), allow_websocket_origin=["127.0.0.1:8000"])
        server.start()
        server.io_loop.start()
    
    # check the socket to make sure only one server is started
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    res = sock.connect_ex(('localhost', 5006))
    if res == 10061:        
        Thread(target=bk_worker).start() # start server if port is not opened
    else:
        print('socket in use') # no server
    
    # embed the bokeh content to the current page with argument.
    script = server_document('http://localhost:5006/bkapp',arguments={'auth':'WW'})
    return render(request, 'bokehview/embed.html', {'script':script})