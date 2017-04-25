from numpy.random import random

from bokeh.plotting import figure, show, output_file

def mscatter(p, x, y, marker):
    p.scatter(x, y, marker=marker, size=15,
              line_color="navy", fill_color="orange", alpha=0.5)

def mtext(p, x, y, text):
    p.text(x, y, text=[text],
           text_color="firebrick", text_align="center", text_font_size="10pt")

p = figure(title="Bokeh Markers", toolbar_location=None)
p.grid.grid_line_color = None
p.background_fill_color = "#eeeeee"
p.axis.visible = False

N = 10

mscatter(p, random(N)+2, random(N)+1, "circle")
mscatter(p, random(N)+4, random(N)+1, "square")
mscatter(p, random(N)+6, random(N)+1, "triangle")
mscatter(p, random(N)+8, random(N)+1, "asterisk")

mscatter(p, random(N)+2, random(N)+4, "circle_x")
mscatter(p, random(N)+4, random(N)+4, "square_x")
mscatter(p, random(N)+6, random(N)+4, "inverted_triangle")
mscatter(p, random(N)+8, random(N)+4, "x")

mscatter(p, random(N)+2, random(N)+7, "circle_cross")
mscatter(p, random(N)+4, random(N)+7, "square_cross")
mscatter(p, random(N)+6, random(N)+7, "diamond")
mscatter(p, random(N)+8, random(N)+7, "cross")

mtext(p, 2.5, 0.5, "circle / o")
mtext(p, 4.5, 0.5, "square")
mtext(p, 6.5, 0.5, "triangle")
mtext(p, 8.5, 0.5, "asterisk / *")

mtext(p, 2.5, 3.5, "circle_x / ox")
mtext(p, 4.5, 3.5, "square_x")
mtext(p, 6.5, 3.5, "inverted_triangle")
mtext(p, 8.5, 3.5, "x")

mtext(p, 2.5, 6.5, "circle_cross / o+")
mtext(p, 4.5, 6.5, "square_cross")
mtext(p, 6.5, 6.5, "diamond")
mtext(p, 8.5, 6.5, "cross / +")

output_file("markers.html", title="markers.py example")

show(p)  # open a browser
