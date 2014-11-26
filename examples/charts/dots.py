from collections import OrderedDict
import pandas as pd
import numpy as np
from bokeh.charts import Dot

# create some example data
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

# any of the following commented are valid Dot inputs
#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = xyvalues.values()
#xyvalues = np.array(xyvalues.values())

dots = Dot(xyvalues, cat=['lists','loops','dicts', 'gen exp', 'exceptions'],
         title="Dots Example", ylabel='Performance', filename="dots.html")
dots.legend("top_left").show()
