import ipyvolume as ipv
import ipywidgets as ipw
import numpy as np
from ipywidgets_bokeh import IPyWidget

from bokeh.layouts import column, row
from bokeh.models import Slider
from bokeh.plotting import curdoc

x, y, z = np.random.random((3, 1000))
ipv.quickscatter(x, y, z, size=1, marker="sphere")
plot = ipv.current.figure

x_slider = Slider(start=0, end=359, value=0, step=1, title="X-axis")
y_slider = Slider(start=0, end=359, value=0, step=1, title="Y-axis")
z_slider = Slider(start=0, end=359, value=0, step=1, title="Z-axis")

def randomize(button):
    x, y, z = np.random.random((3, 1000))
    scatter = plot.scatters[0]
    with plot.hold_sync():
        scatter.x = x
        scatter.y = y
        scatter.z = z

randomize_button = ipw.Button(description="Randomize")
randomize_button.on_event("button_click", randomize)

def change_anglex(change):
    v = round(np.degrees(change["new"])) % 360
    x_slider.value = v
def change_angley(change):
    v = round(np.degrees(change["new"])) % 360
    y_slider.value = v
def change_anglez(change):
    v = round(np.degrees(change["new"])) % 360
    z_slider.value = v
plot.observe(change_anglex, names="anglex")
plot.observe(change_angley, names="angley")
plot.observe(change_anglez, names="anglez")

def change_x(_attr, _old, new):
    plot.anglex = np.radians(new)
def change_y(_attr, _old, new):
    plot.angley = np.radians(new)
def change_z(_attr, _old, new):
    plot.anglez = np.radians(new)
x_slider.on_change("value", change_x)
y_slider.on_change("value", change_y)
z_slider.on_change("value", change_z)

button_wrapper = IPyWidget(widget=randomize_button)
plot_wrapper = IPyWidget(widget=plot)

vbox = column([x_slider, y_slider, z_slider, button_wrapper])
hbox = row([vbox, plot_wrapper])

doc = curdoc()
doc.add_root(hbox)
