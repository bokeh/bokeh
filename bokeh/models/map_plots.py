""" Models for displaying maps in Bokeh plots.

"""
from __future__ import absolute_import

from ..properties import HasProps
from ..properties import Enum, Float, Instance, Int, JSON
from ..enums import MapType

from .plots import Plot

class GMapOptions(HasProps):
    """ Options for GMapPlot objects.

    """

    lat = Float(help="""
    The latitude where the map should be centered.
    """)

    lng = Float(help="""
    The longitude where the map should be centered.
    """)

    zoom = Int(12, help="""
    The initial zoom level to use when displaying the GMapPlot.
    """)

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

class GMapPlot(Plot):
    """ A Bokeh Plot with a `Google Map`_ displayed underneath.

    .. _Google Map: https://www.google.com/maps/

    """

    map_options = Instance(GMapOptions, help="""
    Options for displaying the plot.
    """)

class GeoJSOptions(HasProps):
    """ Options for GeoJSPlot objects.

    """

    lat = Float(help="""
    The latitude where the map should be centered.
    """)

    lng = Float(help="""
    The longitude where the map should be centered.
    """)

    zoom = Int(12, help="""
    The initial zoom level to use when displaying the GeoJSPlot.
    """)

class GeoJSPlot(Plot):
    """ A Bokeh Plot with a `GeoJS Map`_ displayed underneath.

    .. warning::
        GeoJSPlot support should be considered experimental, a subject
        to revision or removal.

    .. _GeoJS Map: https://github.com/OpenGeoscience/geojs

    """

    map_options = Instance(GeoJSOptions, help="""
    Options for displaying the plot.
    """)
