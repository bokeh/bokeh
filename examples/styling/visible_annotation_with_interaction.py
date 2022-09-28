from bokeh.layouts import layout
from bokeh.models import BoxAnnotation, Toggle
from bokeh.plotting import figure, show

p = figure(width=600, height=200, tools='')
p.line([1, 2, 3], [1, 2, 1], line_color="#0072B2")
pink_line = p.line([1, 2, 3], [2, 1, 2], line_color="#CC79A7")

green_box = BoxAnnotation(left=1.5, right=2.5, fill_color='#009E73', fill_alpha=0.1)
p.add_layout(green_box)

# Use js_link to connect button active property to glyph visible property

toggle1 = Toggle(label="Green Box", button_type="success", active=True)
toggle1.js_link('active', green_box, 'visible')

toggle2 = Toggle(label="Pink Line", button_type="success", active=True)
toggle2.js_link('active', pink_line, 'visible')

show(layout([p], [toggle1, toggle2]))
