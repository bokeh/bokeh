from bokeh.layouts import column
from bokeh.plotting import figure, show

x = list(range(11))
y0 = x
y1 = [10 - i for i in x]
y2 = [abs(i - 5) for i in x]

# create three plots
s1 = figure(width=250, height=250, background_fill_color="#fafafa")
s1.scatter(x, y0, size=12, color="#53777a", alpha=0.8)

s2 = figure(width=250, height=250, background_fill_color="#fafafa")
s2.scatter(x, y1, size=12, marker="triangle", color="#c02942", alpha=0.8)

s3 = figure(width=250, height=250, background_fill_color="#fafafa")
s3.scatter(x, y2, size=12, marker="square", color="#d95b43", alpha=0.8)

# put the results in a column and show
show(column(s1, s2, s3))
