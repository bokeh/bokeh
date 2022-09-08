from bokeh.plotting import figure, output_file, show

factors = ["a", "b", "c", "d", "e", "f", "g", "h"]
x = [50, 40, 65, 10, 25, 37, 80, 60]

output_file("categorical.html")

p = figure(y_range=factors)

p.circle(x, factors, size=15, fill_color="orange", line_color="green", line_width=3)

show(p)
