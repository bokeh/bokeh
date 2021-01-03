import numpy as np

from bokeh.layouts import row
from bokeh.models import BoxAnnotation, CustomJS
from bokeh.plotting import figure, output_file, show

output_file('range_update_callback.html')

N = 4000

x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = [
    "#%02x%02x%02x" % (int(r), int(g), 150) for r, g in zip(50+2*x, 30+2*y)
]

box = BoxAnnotation(left=0, right=0, bottom=0, top=0,
    fill_alpha=0.1, line_color='black', fill_color='black')

jscode = """
    box[%r] = cb_obj.start
    box[%r] = cb_obj.end
"""

p1 = figure(title='Pan and Zoom Here', x_range=(0, 100), y_range=(0, 100),
            tools='box_zoom,wheel_zoom,pan,reset', plot_width=400, plot_height=400)
p1.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

xcb = CustomJS(args=dict(box=box), code=jscode % ('left', 'right'))
ycb = CustomJS(args=dict(box=box), code=jscode % ('bottom', 'top'))

p1.x_range.js_on_change('start', xcb)
p1.x_range.js_on_change('end', xcb)
p1.y_range.js_on_change('start', ycb)
p1.y_range.js_on_change('end', ycb)

p2 = figure(title='See Zoom Window Here', x_range=(0, 100), y_range=(0, 100),
            tools='', plot_width=400, plot_height=400)
p2.scatter(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)
p2.add_layout(box)

layout = row(p1, p2)

show(layout)
