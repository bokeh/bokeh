import numpy as np
from bokeh.plotting import figure
from bokeh.models import Spacer, Paragraph
from bokeh.layouts import row, column, widgetbox
from bokeh.io import show

N = 10
x = np.linspace(0, 4 * np.pi, N)
y = np.sin(x)
options = dict(tools="", toolbar_location=None, plot_height=300, plot_width=300)

p1 = figure(title="Line (300 x 100)", **options)
p1.plot_height = 100
p1.line(x, y)

p2 = figure(title="Annular wedge (100 x 300)", title_location='right', **options)
p2.plot_width = 100
p2.annular_wedge(x, y, 10, 20, 0.6, 4.1, inner_radius_units="screen", outer_radius_units="screen")

p3 = figure(title="Bezier (300 x 300)", **options)
p3.bezier(x, y, x + 0.4, y, x + 0.1, y + 0.2, x - 0.1, y - 0.2)

p4 = figure(title="Quad (300 x 300)", **options)
p4.quad(x, x - 0.2, y, y - 0.2)

spacer_1 = Spacer(width=100, height=100)
spacer_2 = Spacer(width=300, height=100)
paragraph = Paragraph(text="We build up a grid plot manually. Try changing the mode yourself.")

MODE = 'fixed'
widgets = widgetbox([paragraph], sizing_mode=MODE)
row_1 = row([spacer_1, p1, spacer_2], sizing_mode=MODE)
row_2 = row([p2, p3, p4], sizing_mode=MODE)
layout = column([widgets, row_1, row_2], sizing_mode=MODE)

show(layout)
