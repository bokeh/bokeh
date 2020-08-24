from jinja2 import Environment, FileSystemLoader
from tornado.web import RequestHandler

from bokeh.embed import server_document
from bokeh.layouts import column
from bokeh.models import ColumnDataSource, Slider
from bokeh.plotting import figure
from bokeh.sampledata.sea_surface_temperature import sea_surface_temperature
from bokeh.server.server import Server
from bokeh.themes import Theme

env = Environment(loader=FileSystemLoader('templates'))

class IndexHandler(RequestHandler):
    def get(self):
        template = env.get_template('embed.html')
        script = server_document('http://localhost:5006/bkapp')
        self.write(template.render(script=script, template="Tornado"))

def bkapp(doc):
    df = sea_surface_temperature.copy()
    source = ColumnDataSource(data=df)

    plot = figure(x_axis_type='datetime', y_range=(0, 25), y_axis_label='Temperature (Celsius)',
                  title="Sea Surface Temperature at 43.18, -70.43")
    plot.line('time', 'temperature', source=source)

    def callback(attr, old, new):
        if new == 0:
            data = df
        else:
            data = df.rolling(f"{new}D").mean()
        source.data = ColumnDataSource.from_df(data)

    slider = Slider(start=0, end=30, value=0, step=1, title="Smoothing by N Days")
    slider.on_change('value', callback)

    doc.add_root(column(slider, plot))

    doc.theme = Theme(filename="theme.yaml")

# Setting num_procs here means we can't touch the IOLoop before now, we must
# let Server handle that. If you need to explicitly handle IOLoops then you
# will need to use the lower level BaseServer class.
# The `static/` end point is reserved for Bokeh resources, as specified in
# bokeh.server.urls. In order to make your own end point for static resources,
# add the following to the `extra_patterns` argument, replacing `DIR` with the desired directory.
# (r'/DIR/(.*)', StaticFileHandler, {'path': os.path.normpath(os.path.dirname(__file__) + '/DIR')})
server = Server({'/bkapp': bkapp}, num_procs=4, extra_patterns=[('/', IndexHandler)])
server.start()

if __name__ == '__main__':
    from bokeh.util.browser import view

    print('Opening Tornado app with embedded Bokeh application on http://localhost:5006/')

    server.io_loop.add_callback(view, "http://localhost:5006/")
    server.io_loop.start()
