''' Define standard error codes and messages for Bokeh validation checks.

'''

codes = {
    1000: ("COLUMN_LENGTHS",    "ColumnDataSource column lengths are not all the same"),
    9999: ("EXT",               "Custom extension reports error"),
}

for code in codes:
    exec("%s = %d" % (codes[code][0], code))




