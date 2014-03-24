import numpy as np
from bokeh.plotting import *
from bokeh.objects import Range1d

d = [[0,1,2,3,4],
     [2,3,4,5,6],
     [4,5,6,7,8],
     [6,7,8,9,10]]
output_server('image')
image(
    image=[d], x=[1], y=[2], dw=[10], dh=[10], palette=["Reds-9"],
    x_range = Range1d(start=0, end=10), y_range = Range1d(start=0, end=10),
    tools="pan,wheel_zoom,box_zoom,reset,previewsave", name="image_example"
)


