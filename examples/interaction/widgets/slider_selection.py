import numpy as np

from bokeh.layouts import column
from bokeh.models import BoxSelectTool, CustomJS, RangeSlider
from bokeh.plotting import figure, show

N = 4000
x = np.random.random(size=N) * 100
y = np.random.random(size=N) * 100
radii = np.random.random(size=N) * 1.5
colors = np.array([(r, g, 150) for r, g in zip(50+2*x, 30+2*y)], dtype=np.uint8)

box_select = BoxSelectTool(persistent=True, continuous=True)
plot = figure(tools=["pan", box_select, "hover"])
plot.circle(x, y, radius=radii, fill_color=colors, fill_alpha=0.6, line_color=None)

x_slider = RangeSlider(value=(10, 90), start=0, end=100)
y_slider = RangeSlider(value=(10, 90), start=0, end=100)

layout = column(x_slider, y_slider, plot)

update_overlay = CustomJS(args=dict(x_slider=x_slider, y_slider=y_slider, box_select=box_select), code="""
    const [x0, x1] = x_slider.value
    const [y0, y1] = y_slider.value
    const lrtb = {left: x0, right: x1, top: y1, bottom: y0}
    box_select.overlay.setv(lrtb)
""")

x_slider.js_on_change("value", update_overlay)
y_slider.js_on_change("value", update_overlay)

update_sliders = CustomJS(args=dict(x_slider=x_slider, y_slider=y_slider), code="""
    const {left: x0, right: x1, top: y1, bottom: y0} = this
    x_slider.value = [x0, x1]
    y_slider.value = [y0, y1]
""")

box_select.overlay.js_on_change("left", update_sliders)
box_select.overlay.js_on_change("right", update_sliders)
box_select.overlay.js_on_change("top", update_sliders)
box_select.overlay.js_on_change("bottom", update_sliders)

show(layout)
