from bokeh.plotting import figure, show, output_file, vplot

N = 4000

factors = ["a", "b", "c", "d", "e", "f", "g", "h"]
x0 = [0, 0, 0, 0, 0, 0, 0, 0]
x =  [50, 40, 65, 10, 25, 37, 80, 60]

output_file("categorical.html", title="categorical.py example")

p1 = figure(title="Dot Plot", tools="resize,save", y_range=factors, x_range=[0,100])

p1.segment(x0, factors, x, factors, line_width=2, line_color="green", )
p1.circle(x, factors, size=15, fill_color="orange", line_color="green", line_width=3, )

factors = ["foo", "bar", "baz"]
x = ["foo", "foo", "foo", "bar", "bar", "bar", "baz", "baz", "baz"]
y = ["foo", "bar", "baz", "foo", "bar", "baz", "foo", "bar", "baz"]
colors = [
    "#0B486B", "#79BD9A", "#CFF09E",
    "#79BD9A", "#0B486B", "#79BD9A",
    "#CFF09E", "#79BD9A", "#0B486B"
]

p2 = figure(title="Categorical Heatmap", tools="resize,hover,save",
    x_range=factors, y_range=factors)

p2.rect(x, y, color=colors, width=1, height=1)

show(vplot(p1, p2))  # open a browser
