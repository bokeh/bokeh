''' These define the standard warning codes and messages for Bokeh
validation checks.

1000 *(MISSING_RENDERERS)*
    A |Plot| object has no renderers configured (will result in a blank plot).

1001 *(NO_DATA_RENDERERS)*
    A |Plot| object has no data renderers (will result in an empty plot frame).

1002 *(EMPTY_LAYOUT)*
    A layout model has no children (will result in a blank layout).

1004 *(BOTH_CHILD_AND_ROOT)*
    Each component can be rendered in only one place, can't be both a root and in a layout.

9999 *(EXT)*
    Indicates that a custom warning check has failed.

'''

codes = {
    1000: ("MISSING_RENDERERS",           "Plot has no renderers"),
    1001: ("NO_DATA_RENDERERS",           "Plot has no data renderers"),
    1002: ("EMPTY_LAYOUT",                "Layout has no children"),
    1004: ("BOTH_CHILD_AND_ROOT",         "Models should not be a document root if they are in a layout box"),
    9999: ("EXT",                         "Custom extension reports warning"),
}

for code in codes:
    exec("%s = %d" % (codes[code][0], code))
