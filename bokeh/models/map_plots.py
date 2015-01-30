""" Models for displaying maps in Bokeh plots.

"""
from __future__ import absolute_import

from ..properties import HasProps
from ..properties import Int, Float, Enum, Instance
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
    The initial `zoom level`_ to use when displaying the GMapPlot.

    .. _zoom level: https://developers.google.com/maps/documentation/staticmaps/#Zoomlevels

    """)

    map_type = Enum(MapType, help="""
    The `map type`_ to use for the GMapPlot.

    .. _map type: https://developers.google.com/maps/documentation/staticmaps/#MapTypes

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
