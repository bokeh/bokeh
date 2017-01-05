""" Models for displaying maps in Bokeh plots.

"""
from __future__ import absolute_import

from ..core import validation
from ..core.validation.warnings import MISSING_RENDERERS, NO_DATA_RENDERERS
from ..core.validation.errors import REQUIRED_RANGE, MISSING_GOOGLE_API_KEY
from ..core.has_props import HasProps
from ..core.properties import abstract
from ..core.properties import Enum, Float, Instance, Int, JSON, Override, String
from ..core.enums import MapType

from .plots import Plot

@abstract
class MapOptions(HasProps):
    """ Abstract base class for map options' models.

    """

    lat = Float(help="""
    The latitude where the map should be centered.
    """)

    lng = Float(help="""
    The longitude where the map should be centered.
    """)

    zoom = Int(12, help="""
    The initial zoom level to use when displaying the map.
    """)

@abstract
class MapPlot(Plot):
    """ Abstract base class for map plot models.

    """

class GMapOptions(MapOptions):
    """ Options for GMapPlot objects.

    """

    map_type = Enum(MapType, help="""
    The `map type`_ to use for the GMapPlot.

    .. _map type: https://developers.google.com/maps/documentation/javascript/reference#MapTypeId

    """)

    styles = JSON(help="""
    A JSON array of `map styles`_ to use for the GMapPlot. Many example styles can
    `be found here`_.

    .. _map styles: https://developers.google.com/maps/documentation/javascript/reference#MapTypeStyle
    .. _be found here: https://snazzymaps.com

    """)

class GMapPlot(MapPlot):
    """ A Bokeh Plot with a `Google Map`_ displayed underneath.

    Data placed on this plot should be specified in decimal lat long coordinates e.g. 37.123, -122.404.
    It will be automatically converted into the web mercator projection to display properly over
    google maps tiles.

    .. _Google Map: https://www.google.com/maps/

    """

    # TODO (bev) map plot might not have these
    @validation.error(REQUIRED_RANGE)
    def _check_required_range(self):
        pass
    @validation.warning(MISSING_RENDERERS)
    def _check_missing_renderers(self):
        pass
    @validation.warning(NO_DATA_RENDERERS)
    def _check_no_data_renderers(self):
        pass

    @validation.error(MISSING_GOOGLE_API_KEY)
    def _check_missing_google_api_key(self):
        if self.api_key is None:
            return str(self)

    map_options = Instance(GMapOptions, help="""
    Options for displaying the plot.
    """)

    border_fill_color = Override(default="#ffffff")

    api_key = String(help="""
    Google Maps API requires an API key. See https://developers.google.com/maps/documentation/javascript/get-api-key
    for more information on how to obtain your own.
    """)
