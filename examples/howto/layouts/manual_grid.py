import numpy as np
from bokeh.core.enums import SizingMode
from bokeh.io import show
from bokeh.layouts import column, grid
from bokeh.plotting import figure
from bokeh.models import Paragraph, Select

N = 10
x = np.linspace(0, 4 * np.pi, N)
y = np.sin(x)
options = dict(tools="", toolbar_location=None, plot_height=300, plot_width=300, sizing_mode="fixed")

p1 = figure(title="Line (300 x 100)", **options)
p1.plot_height = 100
p1.line(x, y)

p2 = figure(title="Annular wedge (100 x 300)", title_location='right', **options)
p2.plot_width = 200
p2.annular_wedge(x, y, 10, 20, 0.6, 4.1, inner_radius_units="screen", outer_radius_units="screen")

p3 = figure(title="Bezier (300 x 300)", **options)
p3.bezier(x, y, x + 0.4, y, x + 0.1, y + 0.2, x - 0.1, y - 0.2)

p4 = figure(title="Quad (300 x 300)", **options)
p4.quad(x, x - 0.2, y, y - 0.2)

paragraph = Paragraph(text="We build up a grid plot manually. Try changing the mode of the plots yourself.")

select = Select(title="Sizing mode", value="fixed", options=list(SizingMode), width=300)

plots = grid([[None, p1, None], [p2, p3, p4]])
layout = column([paragraph, select, plots])

select.js_link('value', p1, 'sizing_mode')
select.js_link('value', p2, 'sizing_mode')
select.js_link('value', p3, 'sizing_mode')
select.js_link('value', p4, 'sizing_mode')
select.js_link('value', layout, 'sizing_mode')

show(layout)
