from bokeh.io import show
from bokeh.models import ColumnDataSource, CustomJS, ColorPicker
from bokeh.plotting import Figure
from bokeh.layouts import row, widgetbox
cds = ColumnDataSource(data=dict(x=(0, 1), y=(0, 1)))

p = Figure(x_range=(0, 1), y_range=(0, 1))
w = ColorPicker(title="Line Color", color="red", height=20, width=100)
line = p.line(x='x', y='y', source=cds, color=w.color)
cb = CustomJS(args={'line': line}, code="""
line.glyph.line_color = cb_obj.color
""")
w.js_on_change('color', cb)

show(row([widgetbox(w, width=100), p]))
