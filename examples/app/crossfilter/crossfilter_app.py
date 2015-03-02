from bokeh.plot_object import PlotObject
from bokeh.server.utils.plugins import object_page
from bokeh.server.app import bokeh_app
from bokeh.plotting import curdoc, cursession
from bokeh.crossfilter.models import CrossFilter
from bokeh.sampledata.autompg import autompg

@bokeh_app.route("/bokeh/crossfilter/")
@object_page("crossfilter")
def make_crossfilter():
    autompg['cyl'] = autompg['cyl'].astype(str)
    autompg['origin'] = autompg['origin'].astype(str)
    app = CrossFilter.create(df=autompg)
    return app
