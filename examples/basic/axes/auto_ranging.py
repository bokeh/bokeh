from bokeh.layouts import row
from bokeh.plotting import figure, show

x = [1, 2, 3, 4, 5, 6, 7, 8]
y = [2, 5, 8, 2, 7, 4, 6, 3]

plots = []
for auto_ranging in ["both", "y"]:
    p = figure(width=350, height=300, title=f'threshold with auto_ranging="{auto_ranging}"')
    p.scatter(x, y, size=10)

    # a threshold line that is meant to span any visible x-range
    p.line([-100, 100], [10, 10], line_color="red", line_width=2, line_dash="dashed", auto_ranging=auto_ranging)

    plots.append(p)

show(row(plots))
