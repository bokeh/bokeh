
from numpy.random import random
from bokeh.plotting import *

output_file("markers.html")

figure(title="markers.py example", tools="pan,wheel_zoom,box_zoom,reset,previewsave")

def myscatter(x, y, typestr):
    scatter(x, y, marker=typestr,
            line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)

def mytext(x, y, textstr):
    text(x, y, text=textstr, angle=0,
         text_color="#449944", text_align="center", text_font_size="10pt")

N = 10

hold()

myscatter(random(N)+2, random(N)+1, "circle")
myscatter(random(N)+4, random(N)+1, "square")
myscatter(random(N)+6, random(N)+1, "triangle")
myscatter(random(N)+8, random(N)+1, "asterisk")

myscatter(random(N)+2, random(N)+4, "circle_x")
myscatter(random(N)+4, random(N)+4, "square_x")
myscatter(random(N)+6, random(N)+4, "inverted_triangle")
myscatter(random(N)+8, random(N)+4, "x")

myscatter(random(N)+2, random(N)+7, "circle_cross")
myscatter(random(N)+4, random(N)+7, "square_cross")
myscatter(random(N)+6, random(N)+7, "diamond")
myscatter(random(N)+8, random(N)+7, "cross")

mytext([2.5], [0.5], "circle / o")
mytext([4.5], [0.5], "square")
mytext([6.5], [0.5], "triangle")
mytext([8.5], [0.5], "asterisk / *")

mytext([2.5], [3.5], "circle_x / ox")
mytext([4.5], [3.5], "square_x")
mytext([6.5], [3.5], "inverted_triangle")
mytext([8.5], [3.5], "x")

mytext([2.5], [6.5], "circle_cross / o+")
mytext([4.5], [6.5], "square_cross")
mytext([6.5], [6.5], "diamond")
mytext([8.5], [6.5], "cross / +")

show()  # open a browser
