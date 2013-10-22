
from numpy.random import random
from bokeh.plotting import *


output_server("markers.py example")

N = 10

hold()

scatter(random(N)+2, random(N), type="circle",   line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+4, random(N), type="square",   line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+6, random(N), type="triangle", line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+8, random(N), type="asterisk",  line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)

scatter(random(N)+2, random(N)+3, type="circle_x",    line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+4, random(N)+3, type="square_x",    line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+6, random(N)+3, type="invtriangle", line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+8, random(N)+3, type="x",    line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)

scatter(random(N)+2, random(N)+6, type="circle_cross", line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+4, random(N)+6, type="square_cross", line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+6, random(N)+6, type="diamond",        line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)
scatter(random(N)+8, random(N)+6, type="cross",            line_color="#6666ee", fill_color="#ee6666", fill_alpha=0.5, size=12)

text([2.5], [1.5], text="circle/o",   angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([4.5], [1.5], text="square",     angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([6.5], [1.5], text="triangle",   angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([8.5], [1.5], text="asterisk/*", angle=0, text_color="#449944", text_align="center", text_font_size="12pt")

text([2.5], [4.5], text="circle_x/ox", angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([4.5], [4.5], text="square_x",    angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([6.5], [4.5], text="invtriangle", angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([8.5], [4.5], text="x",           angle=0, text_color="#449944", text_align="center", text_font_size="12pt")

text([2.5], [7.5], text="circle_cross/o+", angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([4.5], [7.5], text="square_cross",    angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([6.5], [7.5], text="diamond",         angle=0, text_color="#449944", text_align="center", text_font_size="12pt")
text([8.5], [7.5], text="cross/+",         angle=0, text_color="#449944", text_align="center", text_font_size="12pt")

