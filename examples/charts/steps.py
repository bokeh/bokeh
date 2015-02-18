from collections import OrderedDict

import numpy as np
import pandas as pd
from bokeh.charts import Chart, Step, Line
from bokeh.plotting import show,output_file

xyvalues = OrderedDict(
    python=[2, 3, 7, 5, 26, 81, 44, 93, 94, 105, 66, 67, 90, 83],
    pypy=[12, 20, 47, 15, 126, 121, 144, 333, 354, 225, 276, 287, 270, 230],
    jython=[22, 43, 70, 75, 76, 101, 114, 123, 194, 215, 201, 227, 139, 160],
)

# any of the following commented are valid Step inputs
#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = list(xyvalues.values())
#xyvalues = np.array(list(xyvalues.values()))

output_file("steps.html", title="line.py example")
chart = Step(xyvalues, title="Steps", ylabel='measures', filename="steps.html", legend='top_left')
show(chart)
