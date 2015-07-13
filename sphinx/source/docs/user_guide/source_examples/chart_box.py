from bokeh.charts import BoxPlot, output_file, show

# prepare some data
data = {"y": [6, 7, 2, 4, 5], "z": [1, 5, 12, 4, 2]}

# output to static HTML file
output_file("box.html", title="boxplot example")

# create a new line chat with a title and axis labels
p = BoxPlot(data, title="BoxPlot", width=400, height=400)

# show the results
show(p)

