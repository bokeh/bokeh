from bokeh.plotting import figure, output_file, show
from bokeh.layouts import row


p1 = figure(match_aspect=True, title="Circle touches all 4 sides of square")
p1.rect(0, 0, 300, 300, line_color='black')
p1.circle(x=0, y=0, radius=150, line_color='black',
          fill_color='grey', radius_units='data')

p2 = figure(match_aspect=True, aspect_scale=2, title="Aspect scale = 2")
p2.circle([-1, +1, +1, -1], [-1, -1, +1, +1])

output_file("aspect.html")

show(row(p1, p2))
