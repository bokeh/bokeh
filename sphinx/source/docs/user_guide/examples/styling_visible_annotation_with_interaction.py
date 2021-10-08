from bokeh.io import output_file, show
from bokeh.layouts import layout
from bokeh.models import BoxAnnotation, Toggle
from bokeh.plotting import figure

output_file("styling_visible_annotation_with_interaction.html")

p = figure(width=600, height=200, tools='')
p.line([1, 2, 3], [1, 2, 1], line_color="blue")
green_line = p.line([1, 2, 3], [2, 1, 2], line_color="green")

yellow_box = BoxAnnotation(left=1.5, right=2.5, fill_color='yellow', fill_alpha=0.1)
p.add_layout(yellow_box)

# Use js_link to connect button active property to glyph visible property

toggle1 = Toggle(label="Yellow Box", button_type="success", active=True)
toggle1.js_link('active', yellow_box, 'visible')

toggle2 = Toggle(label="Green Line", button_type="success", active=True)
toggle2.js_link('active', green_line, 'visible')

show(layout([p], [toggle1, toggle2]))
