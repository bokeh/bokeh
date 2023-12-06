from bokeh.plotting import figure, show

# prepare some data
x = [1, 2, 3, 4, 5]
y1 = [6, 7, 2, 4, 5]
y2 = [2, 3, 4, 5, 6]
y3 = [4, 5, 5, 7, 2]

# create a new plot with a title and axis labels
p = figure(title="Multiple glyphs example", x_axis_label="x", y_axis_label="y")

# add multiple renderers
p.line(x, y1, legend_label="Temp.", color="#004488", line_width=3)
p.line(x, y2, legend_label="Rate", color="#906c18", line_width=3)
p.scatter(x, y3, legend_label="Objects", color="#bb5566", size=16)

# show the results
show(p)
