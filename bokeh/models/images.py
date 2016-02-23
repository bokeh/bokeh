from __future__ import absolute_import
from ..model import Model
from ..core.properties import (Any, Dict, String, Bool)

class ImageSource(Model):
    """ A base class for all image source types. """

    _args = ('url', 'extra_url_vars')

    url = String(default="", help="""
    tile service url (example: http://c.tile.openstreetmap.org/{Z}/{X}/{Y}.png)
    """)

    extra_url_vars = Dict(String, Any, help="""
    A dictionary that maps url variable template keys to values.
    These variables are useful for parts of tile urls which do not change from tile to tile (e.g. server host name, or layer name).
    """)

class WMSImageSource(ImageSource):
    """ A base class for all image source types. """

    _args = ('url', 'extra_url_vars')

    request = String(default="GetMap", help="""
    """)

    version = String(default="1.1.1", help="""
    """)

    layers = String(default="", help="""
    """)

    styles = String(default="default", help="""
    """)

    f = String(default="image/jpeg", help="""
    """)

    transparent = Bool(default=True, help="""
    """)

    crs = String(default='', help="""
    """)

    attribution = String(default='', help="""
    """)
