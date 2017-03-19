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

9999 *(EXT)*
    Indicates that a custom error check has failed.

'''

codes = {
    1001: ("BAD_COLUMN_NAME",        "Glyph refers to nonexistent column name"),
    1002: ("MISSING_GLYPH",          "Glyph renderer has no glyph set"),
    1003: ("NO_SOURCE_FOR_GLYPH",    "Glyph renderer has no data source"),
    1004: ("REQUIRED_RANGE",         "A required Range objects missing"),
    1005: ("MISSING_GOOGLE_API_KEY", "Google now requires API keys for all Google Maps usage"),
    1006: ("NON_MATCHING_DATA_SOURCES_ON_LEGEND_ITEM_RENDERERS", "LegendItem.label is a field, but renderer data sources don't match"),
    1007: ("MISSING_MERCATOR_DIMENSION", "Mercator Tickers and Formatters must have their dimension property set to 'lat' or 'lon'"),
    9999: ("EXT",                    "Custom extension reports error"),
}

for code in codes:
    exec("%s = %d" % (codes[code][0], code))
