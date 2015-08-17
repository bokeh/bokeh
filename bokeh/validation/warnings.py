''' Define standard warning codes and messages for Bokeh validation checks.

1000 : *MISSING_RENDERERS*
    A |Plot| object has no renderers configured (will result in a blank plot).

1001 : *NO_GLYPH_RENDERERS*
    A |Plot| object has no glyph renderers (will result in an empty plot frame).

1002 : *EMPTY_LAYOUT*
    A layout model has no children (will result in a blank layout).

9999 : *EXT*
    Indicates that a custom warning check has failed.

'''

codes = {
    1000: ("MISSING_RENDERERS",     "Plot has no renderers"),
    1001: ("NO_GLYPH_RENDERERS",    "Plot has no glyph renderers"),
    1002: ("EMPTY_LAYOUT",          "Layout has no children"),
    9999: ("EXT",                   "Custom extension reports warning"),
}

for code in codes:
    exec("%s = %d" % (codes[code][0], code))

