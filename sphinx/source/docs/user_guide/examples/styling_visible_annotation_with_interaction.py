from bokeh.io import output_file, show
from bokeh.plotting import figure
from bokeh.layouts import layout
from bokeh.models import Toggle, BoxAnnotation

output_file("styling_visible_annotation_with_interaction.html")

p = figure(plot_width=600, plot_height=200, tools='')
p.line([1, 2, 3], [1, 2, 1], line_color="blue")
pink_line = p.line([1, 2, 3], [2, 1, 2], line_color="pink")

green_box = BoxAnnotation(left=1.5, right=2.5, fill_color='green', fill_alpha=0.1)
p.add_layout(green_box)

# Use js_link to connect button active property to glyph visble property

toggle1 = Toggle(label="Green Box", button_type="success", active=True)
toggle1.js_link('active', green_box, 'visible')

toggle2 = Toggle(label="Pink Line", button_type="success", active=True)
toggle2.js_link('active', pink_line, 'visible')

show(layout([p], [toggle1, toggle2]))
