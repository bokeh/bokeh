from collections import OrderedDict
import numpy as np
import pandas as pd
from bokeh.charts import Step

xyvalues = [
    [2, 3, 7, 5, 26, 81, 44, 93, 94, 105, 66, 67, 90, 83],
    [12, 20, 47, 15, 126, 121, 144, 333, 354, 225, 276, 287, 270, 230],
    [22, 43, 70, 75, 76, 101, 114, 123, 194, 215, 201, 227, 139, 160],
]

xyvalues = OrderedDict(
    python = xyvalues[0],
    pypy = xyvalues[1],
    jython = xyvalues[2]
)

# any of the following commented are valid Step inputs
#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = xyvalues.values()
#xyvalues = np.array(xyvalues.values())

step = Step(xyvalues, title="Steps", ylabel='Measures', filename="steps.html")
step.legend("top_left").show()