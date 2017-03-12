from bokeh.io import output_file, show
from bokeh.plotting import figure
from bokeh.layouts import layout
from bokeh.models import Toggle, BoxAnnotation, CustomJS

# We set-up the same standard figure with two lines and now a box over top
p = figure(plot_width=600, plot_height=200, tools='')
visible_line = p.line([1, 2, 3], [1, 2, 1], line_color="blue")
invisible_line = p.line([1, 2, 3], [2, 1, 2], line_color="pink")

box = BoxAnnotation(left=1.5, right=2.5, fill_color='green', fill_alpha=0.1)
p.add_layout(box)

# We write coffeescript to link toggle with visible property of box and line
code = '''\
object.visible = toggle.active
'''

callback1 = CustomJS.from_coffeescript(code=code, args={})
toggle1 = Toggle(label="Green Box", button_type="success", callback=callback1)
callback1.args = {'toggle': toggle1, 'object': box}

callback2 = CustomJS.from_coffeescript(code=code, args={})
toggle2 = Toggle(label="Pink Line", button_type="success", callback=callback2)
callback2.args = {'toggle': toggle2, 'object': invisible_line}

output_file("styling_visible_annotation_with_interaction.html")

show(layout([p], [toggle1, toggle2]))
