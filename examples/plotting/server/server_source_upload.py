# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *
from bokeh.objects import ServerDataSource 
import pandas as pd
output_server("remotedata")
import numpy as np
from bokeh.plotting import *
output_server("upload_server_line")
N = 100000
x = np.linspace(0, 4*np.pi, N)
y = np.sin(x)
df = pd.DataFrame({'x':x, 'y':y})
source = cursession().data_source("sin", dataframe=df)
line('x', 'y',
     tools="pan,wheel_zoom,box_zoom,reset,previewsave",
     source=source)

show()
