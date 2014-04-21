from bokeh.plotting import *

output_file("image_url.html")

image_url(
    url=["http://bokeh.pydata.org/_static/bokeh-transparent.png"]*10, 
    x=list(range(0, 100, 10)), 
    y=list(range(0, 100, 10)), 
    angle=0
)

show()
