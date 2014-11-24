from collections import OrderedDict
from bokeh.charts.dot import Dot

xyvalues = [
    [2,3,7, 5,26],
    [12,33,47, 15,126,],
    [22,43,10, 25,26,],
]

xyvalues = OrderedDict(
    python = xyvalues[0],
    pypy = xyvalues[1],
    jython = xyvalues[2]
)

ts = Dot(xyvalues, cat=['lists','loops','dicts', 'gen exp', 'exceptions'],
         title="Lines, pd_input",
         ylabel='Performance', filename="line.html")
ts.legend("top_left").show()
