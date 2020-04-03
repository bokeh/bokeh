#-----------------------------------------------------------------------------
# Copyright (c) 2012 - 2020, Anaconda, Inc., and Bokeh Contributors.
# All rights reserved.
#
# The full license is in the file LICENSE.txt, distributed with this software.
#-----------------------------------------------------------------------------
''' These define the standard error codes and messages for Bokeh
validation checks.

1001 *(BAD_COLUMN_NAME)*
    A glyph has a property set to a field name that does not correspond to any
    column in the |GlyphRenderer|'s data source.

1002 *(MISSING_GLYPH)*
    A |GlyphRenderer| has no glyph configured.

1003 *(NO_SOURCE_FOR_GLYPH)*
    A |GlyphRenderer| has no data source configured.

1004 *(REQUIRED_RANGE)*
    A |Plot| is missing one or more required default ranges (will result in
    blank plot).

1005 *(MISSING_GOOGLE_API_KEY)*
    Google Maps API now requires an API key for all use. See
    https://developers.google.com/maps/documentation/javascript/get-api-key
    for more information on how to obtain your own, to use for the
    ``api_key`` property of your Google Map plot .

1006 *(NON_MATCHING_DATA_SOURCES_ON_LEGEND_ITEM_RENDERERS)*
    All data_sources on ``LegendItem.renderers`` must match when LegendItem.label
    is type field.

1007 *(MISSING_MERCATOR_DIMENSION)*
    ``MercatorTicker`` and ``MercatorTickFormatter``models must have their
    ``dimension`` property set to ``'lat'`` or ``'lon'``.

1008 *(REQUIRED_SCALE)*
    A |Scale| on is missing one or more required default scales (will result in
    blank plot).

1009 *(INCOMPATIBLE_SCALE_AND_RANGE)*
    A |Scale| type is incompatible with one or more ranges on the same plot
    dimension (will result in blank plot).

1010 *(CDSVIEW_SOURCE_DOESNT_MATCH)*
    A |GlyphRenderer| has a ``CDSView`` whose source doesn't match the ``GlyphRenderer``'s
    data source.

1011 *(MALFORMED_GRAPH_SOURCE)*
    The ``GraphSource`` is incorrectly configured.

1012 *(INCOMPATIBLE_MAP_RANGE_TYPE)*
    Map plots can only support ``Range1d`` types, not data ranges.

1013 *(INCOMPATIBLE_POINT_DRAW_RENDERER)*
    The ``PointDrawTool`` renderers may only reference ``XYGlyph`` models.

1014 *(INCOMPATIBLE_BOX_EDIT_RENDERER)*
    The ``BoxEditTool`` renderers may only reference ``Rect`` glyph models.

1015 *(INCOMPATIBLE_POLY_DRAW_RENDERER)*
    The ``PolyDrawTool`` renderers may only reference ``MultiLine`` and ``Patches`` glyph models.

1016 *(INCOMPATIBLE_POLY_EDIT_RENDERER)*
    The ``PolyEditTool`` renderers may only reference ``MultiLine`` and ``Patches`` glyph models.

1017 *(INCOMPATIBLE_POLY_EDIT_VERTEX_RENDERER)*
    The ``PolyEditTool`` vertex_renderer may only reference ``XYGlyph`` models.

1018 *(NO_RANGE_TOOL_RANGES)*
    The ``RangeTool`` must have at least one of ``x_range`` or ``y_range`` configured

1019 *(DUPLICATE_FACTORS)*
    ``FactorRange`` must specify a unique list of categorical factors for an axis.

1020 *(BAD_EXTRA_RANGE_NAME)*
    An extra range name is configured with a name that does not correspond to any range.

1021 *(EQUAL_SLIDER_START_END)*
    ``noUiSlider`` most have a nonequal start and end.

1022 *(MIN_PREFERRED_MAX_WIDTH)*
    Expected min_width <= width <= max_width

1023 *(MIN_PREFERRED_MAX_HEIGHT)*
    Expected min_height <= height <= max_height

1024 *(CDSVIEW_FILTERS_WITH_CONNECTED)*
    ``CDSView`` filters are not compatible with glyphs with connected topology such as Line or Patch.

9999 *(EXT)*
    Indicates that a custom error check has failed.

'''

#-----------------------------------------------------------------------------
# Boilerplate
#-----------------------------------------------------------------------------
import logging # isort:skip
log = logging.getLogger(__name__)

#-----------------------------------------------------------------------------
# Imports
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Globals and constants
#-----------------------------------------------------------------------------

codes = {
    1001: ("BAD_COLUMN_NAME",                                    "Glyph refers to nonexistent column name. This could either be due to a misspelling or typo, or due to an expected column being missing. "), # NOQA
    1002: ("MISSING_GLYPH",                                      "Glyph renderer has no glyph set"),
    1003: ("NO_SOURCE_FOR_GLYPH",                                "Glyph renderer has no data source"),
    1004: ("REQUIRED_RANGE",                                     "A required Range object is missing"),
    1005: ("MISSING_GOOGLE_API_KEY",                             "Google now requires API keys for all Google Maps usage"),
    1006: ("NON_MATCHING_DATA_SOURCES_ON_LEGEND_ITEM_RENDERERS", "LegendItem.label is a field, but renderer data sources don't match"),
    1007: ("MISSING_MERCATOR_DIMENSION",                         "Mercator Tickers and Formatters must have their dimension property set to 'lat' or 'lon'"),
    1008: ("REQUIRED_SCALE",                                     "A required Scale object is missing"),
    1009: ("INCOMPATIBLE_SCALE_AND_RANGE",                       "A Scale is incompatible with one or more ranges on the same plot dimension"),
    1010: ("CDSVIEW_SOURCE_DOESNT_MATCH",                        "CDSView used by Glyph renderer must have a source that matches the Glyph renderer's data source"),
    1011: ("MALFORMED_GRAPH_SOURCE",                             "The GraphSource is incorrectly configured"),
    1012: ("INCOMPATIBLE_MAP_RANGE_TYPE",                        "Map plots can only support Range1d types, not data ranges"),
    1013: ("INCOMPATIBLE_POINT_DRAW_RENDERER",                   "PointDrawTool renderers may only reference XYGlyph models"),
    1014: ("INCOMPATIBLE_BOX_EDIT_RENDERER",                     "BoxEditTool renderers may only reference Rect glyph models"),
    1015: ("INCOMPATIBLE_POLY_DRAW_RENDERER",                    "PolyDrawTool renderers may only reference MultiLine and Patches glyph models"),
    1016: ("INCOMPATIBLE_POLY_EDIT_RENDERER",                    "PolyEditTool renderers may only reference MultiLine and Patches glyph models"),
    1017: ("INCOMPATIBLE_POLY_EDIT_VERTEX_RENDERER",             "PolyEditTool vertex_renderer may only reference XYGlyph models"),
    1018: ("NO_RANGE_TOOL_RANGES",                               "RangeTool must have at least one of x_range or y_range configured"),
    1019: ("DUPLICATE_FACTORS",                                  "FactorRange must specify a unique list of categorical factors for an axis"),
    1020: ("BAD_EXTRA_RANGE_NAME",                               "An extra range name is configued with a name that does not correspond to any range"),
    1021: ("EQUAL_SLIDER_START_END",                             "Slider 'start' and 'end' cannot be equal"),
    1022: ("MIN_PREFERRED_MAX_WIDTH",                            "Expected min_width <= width <= max_width"),
    1023: ("MIN_PREFERRED_MAX_HEIGHT",                           "Expected min_height <= height <= max_height"),
    1024: ("CDSVIEW_FILTERS_WITH_CONNECTED",                     "CDSView filters are not compatible with glyphs with connected topology such as Line or Patch"),
    9999: ("EXT",                                                "Custom extension reports error"),
}

__all__ = ()

#-----------------------------------------------------------------------------
# General API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Dev API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Private API
#-----------------------------------------------------------------------------

#-----------------------------------------------------------------------------
# Code
#-----------------------------------------------------------------------------

for code in codes:
    exec("%s = %d" % (codes[code][0], code))
