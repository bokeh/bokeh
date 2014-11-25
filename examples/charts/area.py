from collections import OrderedDict
from bokeh.charts.area import Area

xyvalues = [
    [2,3,7, 5,26,221,44,233,254,265,266,267,120,111],
    [12,33,47, 15,126,121,144,233,254,225,226,267,110,130],
    [22,43,10,25,26,101,114,203,194,215,201,227, 139, 160],
]

xyvalues = OrderedDict(
    python=xyvalues[0],
    pypy=xyvalues[1],
    jython=xyvalues[2],
)

ts = Area(
    xyvalues, title="Lines, pd_input",
    ylabel='Performance', filename="line.html",
    facet=False, stacked=False
)
ts.legend("top_left").show()
