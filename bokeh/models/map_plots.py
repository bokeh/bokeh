""" Models for displaying maps in Bokeh plots.

"""
from __future__ import absolute_import

from ..properties import HasProps, abstract
from ..properties import Enum, Float, Instance, Int, JSON
from ..enums import MapType
from ..validation.warnings import MISSING_RENDERERS, NO_GLYPH_RENDERERS
from ..validation.errors import REQUIRED_RANGE
from .. import validation

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

    map_options = Instance(MapOptions, help="""
    Options for displaying the plot.
    """)

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
    @validation.warning(NO_GLYPH_RENDERERS)
    def _check_no_glyph_renderers(self):
        pass

    map_options = Instance(GMapOptions, help="""
    Options for displaying the plot.
    """)

class GeoJSOptions(MapOptions):
    """ Options for GeoJSPlot objects.

    """

class GeoJSPlot(MapPlot):
    """ A Bokeh Plot with a `GeoJS Map`_ displayed underneath.

    .. warning::
        GeoJSPlot support should be considered experimental, a subject
        to revision or removal.

    .. _GeoJS Map: https://github.com/OpenGeoscience/geojs

    """

    # TODO (bev) map plot might not have these
    @validation.error(REQUIRED_RANGE)
    def _check_required_range(self):
        pass
    @validation.warning(MISSING_RENDERERS)
    def _check_missing_renderers(self):
        pass
    @validation.warning(NO_GLYPH_RENDERERS)
    def _check_no_glyph_renderers(self):
        pass

    map_options = Instance(GeoJSOptions, help="""
    Options for displaying the plot.
    """)
