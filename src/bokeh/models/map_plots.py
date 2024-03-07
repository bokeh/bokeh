#-----------------------------------------------------------------------------
# Copyright (c) Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' Models for displaying maps in Bokeh plots.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
from __future__ import annotations

import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

# Bokeh imports
from ..core.enums import MapType
from ..core.has_props import abstract
from ..core.properties import (
    JSON,
    Bool,
    Bytes,
    Enum,
    Float,
    Instance,
    InstanceDefault,
    Int,
    Nullable,
    Override,
    Required,
    String,
)
from ..core.validation import error, warning
from ..core.validation.errors import (
    INCOMPATIBLE_MAP_RANGE_TYPE,
    MISSING_GOOGLE_API_KEY,
    REQUIRED_RANGE,
)
from ..core.validation.warnings import MISSING_RENDERERS
from ..model import Model
from ..models.ranges import Range1d
from .plots import Plot

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

__all__ = (
    'GMapOptions',
    'GMapPlot',
    'MapOptions',
    'MapPlot',
)

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

@abstract
class MapOptions(Model):
    ''' Abstract base class for map options' models.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    lat = Required(Float, help="""
    The latitude where the map should be centered.
    """)

    lng = Required(Float, help="""
    The longitude where the map should be centered.
    """)

    zoom = Int(12, help="""
    The initial zoom level to use when displaying the map.
    """)

@abstract
class MapPlot(Plot):
    ''' Abstract base class for map plot models.

    '''

    def __init__(self, *args, **kwargs) -> None:
        from ..models.ranges import Range1d
        for r in ('x_range', 'y_range'):
            if r in kwargs and not isinstance(kwargs.get(r), Range1d):
                raise ValueError(f"Invalid value for {r!r}, MapPlot ranges may only be Range1d, not data ranges")
        super().__init__(*args, **kwargs)

    @error(INCOMPATIBLE_MAP_RANGE_TYPE)
    def _check_incompatible_map_range_type(self):
        from ..models.ranges import Range1d
        if self.x_range is not None and not isinstance(self.x_range, Range1d):
            return "%s.x_range" % str(self)
        if self.y_range is not None and not isinstance(self.y_range, Range1d):
            return "%s.y_range" % str(self)

class GMapOptions(MapOptions):
    ''' Options for ``GMapPlot`` objects.

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    map_type = Enum(MapType, default="roadmap", help="""
    The `map type`_ to use for the ``GMapPlot``.

    .. _map type: https://developers.google.com/maps/documentation/javascript/reference#MapTypeId

    """)

    scale_control = Bool(default=False, help="""
    Whether the Google map should display its distance scale control.
    """)

    styles = Nullable(JSON, default=None, help="""
    A JSON array of `map styles`_ to use for the ``GMapPlot``. Many example styles can
    `be found here`_.

    .. _map styles: https://developers.google.com/maps/documentation/javascript/reference#MapTypeStyle
    .. _be found here: https://snazzymaps.com

    """)

    tilt = Int(default=45, help="""
    `Tilt`_ angle of the map. The only allowed values are 0 and 45.
    Only has an effect on 'satellite' and 'hybrid' map types.
    A value of 0 causes the map to always use a 0 degree overhead view.
    A value of 45 causes the tilt angle to switch to 45 imagery if available.

    .. _Tilt: https://developers.google.com/maps/documentation/javascript/reference/3/map#MapOptions.tilt

    """)

class GMapPlot(MapPlot):
    ''' A Bokeh Plot with a `Google Map`_ displayed underneath.

    Data placed on this plot should be specified in decimal lat/lon coordinates
    e.g. ``(37.123, -122.404)``. It will be automatically converted into the
    web mercator projection to display properly over google maps tiles.

    The ``api_key`` property must be configured with a Google API Key in order
    for ``GMapPlot`` to function. The key will be stored in the Bokeh Document
    JSON.

    Note that Google Maps exert explicit control over aspect ratios at all
    times, which imposes some limitations on ``GMapPlot``:

    * Only ``Range1d`` ranges are supported. Attempting to use other range
      types will result in an error.

    * Usage of ``BoxZoomTool`` is incompatible with ``GMapPlot``. Adding a
      ``BoxZoomTool`` will have no effect.

    .. _Google Map: https://www.google.com/maps/

    '''

    # explicit __init__ to support Init signatures
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

    # TODO (bev) map plot might not have these
    @error(REQUIRED_RANGE)
    def _check_required_range(self):
        pass

    @warning(MISSING_RENDERERS)
    def _check_missing_renderers(self):
        pass

    @error(MISSING_GOOGLE_API_KEY)
    def _check_missing_google_api_key(self):
        if self.api_key is None:
            return str(self)

    map_options = Instance(GMapOptions, help="""
    Options for displaying the plot.
    """)

    border_fill_color = Override(default="#ffffff")

    background_fill_alpha = Override(default=0.0)

    api_key = Required(Bytes, help="""
    Google Maps API requires an API key. See https://developers.google.com/maps/documentation/javascript/get-api-key
    for more information on how to obtain your own.
    """).accepts(String, lambda val: val.encode("utf-8"))

    api_version = String(default="weekly", help="""
    The version of Google Maps API to use. See https://developers.google.com/maps/documentation/javascript/versions
    for more information.

    .. note::
        Changing this value may result in broken map rendering.

    """)

    x_range = Override(default=InstanceDefault(Range1d))

    y_range = Override(default=InstanceDefault(Range1d))

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------
