import numpy as np

from bokeh.io import show
from bokeh.plotting import Figure
from bokeh.models import ColumnDataSource, CustomJS, Spinner
from bokeh.layouts import row, widgetbox

data = np.random.rand(10, 2)
cds = ColumnDataSource(data=dict(x=data[:, 0], y=data[:, 1]))

p = Figure(x_range=(0, 1), y_range=(0, 1))
points = p.scatter(x='x', y='y', source=cds)

w = Spinner(title="Glyph size", low=1, high=20, step=0.1, value=4, width=100)
cb = CustomJS(args={'points': points}, code="""
points.glyph.size = cb_obj.value
""")
points.glyph.size = w.value

w.js_on_change('value', cb)

show(row([widgetbox(w, width=100), p]))
