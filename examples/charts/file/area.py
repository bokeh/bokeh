from bokeh.charts import Area, show, output_file, defaults
from bokeh.layouts import row

defaults.width = 400
defaults.height = 400

# create some example data
data = dict(
    python=[2, 3, 7, 5, 26, 221, 44, 233, 254, 265, 266, 267, 120, 111],
    pypy=[12, 33, 47, 15, 126, 121, 144, 233, 254, 225, 226, 267, 110, 130],
    jython=[22, 43, 10, 25, 26, 101, 114, 203, 194, 215, 201, 227, 139, 160],
)

area1 = Area(data, title="Area Chart", legend="top_left",
             xlabel='time', ylabel='memory')

area2 = Area(data, title="Stacked Area Chart", legend="top_left",
             stack=True, xlabel='time', ylabel='memory')

output_file("area.html", title="area.py example")

show(row(area1, area2))
