''' Define standard error codes and messages for Bokeh validation checks.

1000 : *COLUMN_LENGTHS*
    A |ColumnDataSource| has columns whose lengths are not all the same.

1001 : *BAD_COLUMN_NAME*
    A glyph has a property set to a field name that does not correspond to any
    column in the |GlyphRenderer|'s data source.

1002 : *MISSING_GLYPH*
    A |GlyphRenderer| has no glyph configured.

1003 : *NO_SOURCE_FOR_GLYPH*
    A |GlyphRenderer| has no data source configured.

1004 : *REQUIRED_RANGE*
    A |Plot| is missing one or more required default ranges (will result in
    blank plot).

9999 : *EXT*
    Indicates that a custom error check has failed.

'''

codes = {
    1000: ("COLUMN_LENGTHS",        "ColumnDataSource column lengths are not all the same"),
    1001: ("BAD_COLUMN_NAME",       "Glyph refers to nonexistent column name"),
    1002: ("MISSING_GLYPH",         "Glyph renderer has no glyph set"),
    1003: ("NO_SOURCE_FOR_GLYPH",   "Glyph renderer has no data source"),
    1004: ("REQUIRED_RANGE",        "A required Range objects missing"),
    9999: ("EXT",                   "Custom extension reports error"),
}

for code in codes:
    exec("%s = %d" % (codes[code][0], code))




