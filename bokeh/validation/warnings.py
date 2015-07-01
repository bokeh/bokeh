''' Define standard warning codes and messages for Bokeh validation checks.

'''

codes = {
    1000: ("MISSING_RENDERERS",     "Plot has no renderers"),
    1001: ("NO_GLYPH_RENDERERS",    "Plot has no glyph renderers"),
    1002: ("EMPTY_LAYOUT",          "Layout has no children"),
    9999: ("EXT",                   "Custom extension reports warning"),
}

for code in codes:
    exec("%s = %d" % (codes[code][0], code))

