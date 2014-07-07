# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

import numpy as np
from bokeh.plotting import *

d = [[0,1,2,3,4],
     [2,3,4,5,6],
     [4,5,6,7,8],
     [6,7,8,9,10]]
output_server('image')
image(
    image=[d], x=[1], y=[2], dw=[10], dh=[10], palette=["Reds-9"],
    x_range=[1, 11], y_range=[2, 11],
    tools="pan,wheel_zoom,box_zoom,reset,previewsave", name="image_example"
)

show()
