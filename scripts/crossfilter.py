from bokeh.plot_object import PlotObject
from bokeh.server.utils.plugins import object_page
from bokeh.server.app import bokeh_app
from bokeh.plotting import curdoc, cursession
from bokeh.crossfilter.objects import CrossFilter
from bokeh.sampledata.autompg import autompg

@bokeh_app.route("/myapp")
@object_page("myapp")
def make_object():
    autompg['cyl'] = autompg['cyl'].astype(str)
    autompg['origin'] = autompg['cyl'].astype(str)
    app = CrossFilter.create(df=autompg)
    return app
