from bokeh.charts import Bar, output_file, show

# prepare some data
data = {"y": [6, 7, 2, 4, 5], "z": [1, 5, 12, 4, 2]}

# output to static HTML file
output_file("bar.html")

# create a new line chat with a title and axis labels
p = Bar(data, cat=['C1', 'C2', 'C3', 'D1', 'D2'], title="Bar example",
        xlabel='categories', ylabel='values', width=400, height=400)

# show the results
show(p)
