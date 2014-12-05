from bokeh.plotting import *

output_file("image_url.html")

p = figure()

url = ["http://bokeh.pydata.org/_static/bokeh-transparent.png"]*10
x = list(range(0, 100, 10))
y = list(range(0, 100, 10))
p.image_url(x=x, y=y, url=url, angle=0)

show(p)
