''' Models for displaying maps in Bokeh plots.

'''
from __future__ import absolute_import

from ..core.enums import MapType
from ..core.has_props import abstract
from ..core.properties import Bool, Enum, Float, Instance, Int, JSON, Override, String
from ..core.validation import error, warning
from ..core.validation.warnings import MISSING_RENDERERS, NO_DATA_RENDERERS
from ..core.validation.errors import INCOMPATIBLE_MAP_RANGE_TYPE, REQUIRED_RANGE, MISSING_GOOGLE_API_KEY
from ..model import Model
from .plots import Plot

@abstract
class MapOptions(Model):
    ''' Abstract base class for map options' models.

    '''

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
    ''' Abstract base class for map plot models.

    '''

    def __init__(self, *args, **kw):
        from ..models.ranges import Range1d
        for r in ('x_range', 'y_range'):
            if r in kw and not isinstance(kw.get(r), Range1d):
                raise ValueError('Invalid value for %r, MapPlot ranges may only be Range1d, not data ranges' % r)
        super(MapPlot, self).__init__(*args, **kw)

    @error(INCOMPATIBLE_MAP_RANGE_TYPE)
    def _check_incompatible_map_range_type(self):
        from ..models.ranges import Range1d
        if self.x_range is not None and not isinstance(self.x_range, Range1d):
            return "%s.x_range" % str(self)
        if self.y_range is not None and not isinstance(self.y_range, Range1d):
            return "%s.y_range" % str(self)

class GMapOptions(MapOptions):
    ''' Options for GMapPlot objects.

    '''

    map_type = Enum(MapType, default="roadmap", help="""
    The `map type`_ to use for the GMapPlot.

    .. _map type: https://developers.google.com/maps/documentation/javascript/reference#MapTypeId

    """)

    scale_control = Bool(default=False, help="""
    Whether the Google map should display its distance scale control.
    """)

    styles = JSON(help="""
    A JSON array of `map styles`_ to use for the GMapPlot. Many example styles can
    `be found here`_.

    .. _map styles: https://developers.google.com/maps/documentation/javascript/reference#MapTypeStyle
    .. _be found here: https://snazzymaps.com

    """)

class GMapPlot(MapPlot):
    ''' A Bokeh Plot with a `Google Map`_ displayed underneath.

    Data placed on this plot should be specified in decimal lat/lon coordinates
    e.g. ``(37.123, -122.404)``. It will be automatically converted into the
    web mercator projection to display properly over google maps tiles.

    Please also note that only ``Range1d`` ranges are supported by ``GMapPlot``.

    .. _Google Map: https://www.google.com/maps/

    '''

    # TODO (bev) map plot might not have these
    @error(REQUIRED_RANGE)
    def _check_required_range(self):
        pass

    @warning(MISSING_RENDERERS)
    def _check_missing_renderers(self):
        pass

    @warning(NO_DATA_RENDERERS)
    def _check_no_data_renderers(self):
        pass

    @error(MISSING_GOOGLE_API_KEY)
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
