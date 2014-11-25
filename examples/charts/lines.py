from collections import OrderedDict
import numpy as np
import pandas as pd
from bokeh.charts import Line

xyvalues = [
    [2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120, 111],
    [12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110, 130],
    [22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139, 160],
]

xyvalues = OrderedDict(
    python=xyvalues[0],
    pypy=xyvalues[1],
    jython=xyvalues[2]
)

# any of the following commented are valid Line inputs
#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = xyvalues.values()
#xyvalues = np.array(xyvalues.values())

line = Line(xyvalues, title="Lines", ylabel='Measures', filename="line.html")
line.legend("top_left").show()
