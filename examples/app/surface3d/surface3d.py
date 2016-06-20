from os.path import dirname, join

from bokeh.core.properties import Any, Dict, Instance, String
from bokeh.models import ColumnDataSource, LayoutDOM

DEFAULTS = {
    'width':          '600px',
    'height':         '600px',
    'style':          'surface',
    'showPerspective': True,
    'showGrid':        True,
    'keepAspectRatio': True,
    'verticalRatio':   1.0,
    'legendLabel':     'stuff',
    'cameraPosition':  {
        'horizontal': -0.35,
        'vertical':    0.22,
        'distance':    1.8,
    }
}

class Surface3d(LayoutDOM):

    __implementation__ = open(join(dirname(__file__), "surface3d.js")).read()

    x = String

    y = String

    z = String

    color = String

    data_source = Instance(ColumnDataSource)

    options = Dict(String, Any, default=DEFAULTS)
