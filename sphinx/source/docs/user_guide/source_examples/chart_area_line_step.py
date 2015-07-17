from bokeh.charts import Line, output_file, show

# prepare some data
data = {"y": [6, 7, 2, 4, 5], "z": [1, 5, 12, 4, 2]}

# output to static HTML file
output_file("lines.html", title="line plot example")

# create a new line chat with a title and axis labels
p = Line(data, title="simple line example", xlabel='x', ylabel='values', width=400, height=400)

# show the results
show(p)
