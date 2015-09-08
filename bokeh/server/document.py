'''

'''

from bokeh.plot_object import PlotObject
from bokeh.properties import Any, Dict, String, Instance

class Document(PlotObject):
    ''' A Bokeh Document is a collection of data and related Bokeh Models that
    BokehJS can use to generate an interactive visualization in a browser.

    Bokeh Documents are composed of three parts:

    :models:
        A mapping between Bokeh model objects (e.g., glyphs, guides, plots,
        widgets, annotations) and their unique IDs.

    :stores:
        A mapping between Bokeh DataStore objects (e.g., ColumnDataStore) and
        their unique IDs.

    :variables:
        A "scratch" namespace that maps string names to simple data values.

    '''

    # TODO (bev) introduce Model base class
    models = Dict(String, Instance(PlotObject), help='''

    ''')

    # TODO (bev) introduce DataStore base class
    stores = Dict(String, Instance(PlotObject), help='''

    ''')

    variables = Dict(String, Any, help='''

    ''')