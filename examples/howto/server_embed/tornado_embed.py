from jinja2 import Environment, FileSystemLoader
import pandas as pd
import yaml

from tornado.ioloop import IOLoop
from tornado.web import RequestHandler

from bokeh.application import Application
from bokeh.application.handlers import FunctionHandler
from bokeh.embed import autoload_server
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Slider
from bokeh.plotting import figure
from bokeh.server.server import Server
from bokeh.themes import Theme

env = Environment(loader=FileSystemLoader('templates'))

class IndexHandler(RequestHandler):
    def get(self):
        template = env.get_template('embed.html')
        script = autoload_server(url='http://localhost:5006/bkapp')
        self.write(template.render(script=script, template="Tornado"))

def modify_doc(doc):
    data_url = "http://www.neracoos.org/erddap/tabledap/B01_sbe37_all.csvp?time,temperature&depth=1&temperature_qc=0&time>=2016-02-15&time<=2017-03-22"
    df = pd.read_csv(data_url, parse_dates=True, index_col=0)
    df = df.rename(columns={'temperature (celsius)': 'temperature'})
    df.index.name = 'time'

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

    doc.theme = Theme(json=yaml.load("""
        attrs:
            Figure:
                background_fill_color: "#DDDDDD"
                outline_line_color: white
                toolbar_location: above
                height: 500
                width: 800
            Grid:
                grid_line_dash: [6, 4]
                grid_line_color: white
    """))

bokeh_app = Application(FunctionHandler(modify_doc))

io_loop = IOLoop.current()

server = Server({'/bkapp': bokeh_app}, io_loop=io_loop, extra_patterns=[('/', IndexHandler)])
server.start()

if __name__ == '__main__':
    from bokeh.util.browser import view

    print('Opening Tornado app with embedded Bokeh application on http://localhost:5006/')

    io_loop.add_callback(view, "http://localhost:5006/")
    io_loop.start()
