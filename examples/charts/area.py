from collections import OrderedDict
from bokeh.charts import Area

# create some example data
xyvalues = [
    [2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120, 111],
    [12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110, 130],
    [22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139, 160],
]

xyvalues = OrderedDict(
    python=xyvalues[0],
    pypy=xyvalues[1],
    jython=xyvalues[2],
)

# create an area chart
area = Area(
    xyvalues, title="Area Chart",
    ylabel='Performance', filename="area.html",
    facet=False, stacked=True
)
area.legend("top_left").show()
