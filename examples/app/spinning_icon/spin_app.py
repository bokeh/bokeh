"""
Demonstrate a simple app that in response to a button click,
updates an icon to spin and then does additional updates.
"""

from __future__ import print_function

import time

from bokeh.models import Plot
from bokeh.models.widgets import VBox, Icon, Button
from bokeh.plotting import figure, curdoc
from bokeh.properties import Instance
from bokeh.server.app import bokeh_app
from bokeh.server.utils.plugins import object_page
import numpy as np

class SpinApp(VBox):
  extra_generated_classes = [["SpinApp", "SpinApp", "VBox"]]
  jsmodel = "VBox"

  icon = Instance(Icon)
  button = Instance(Button)
  plot = Instance(Plot)

  @classmethod
  def create(cls):
    obj = cls()
    obj.icon = Icon(name="refresh")
    obj.button = Button(label="Load", type="primary", icon=obj.icon)
    obj.plot = figure(title="random data")
    obj.set_children()
    return obj

  def set_children(self):
    self.children = [self.button, self.plot]

  def setup_events(self):
    if self.icon:
      self.icon.on_change('spin_updates', self, 'on_spin_change')
    if self.button:
      self.button.on_change('clicks', self, 'on_button_click')

  def on_button_click(self, obj, attrname, old, new):
    self.icon.spin = True

  def on_spin_change(self, obj, attrname, old, new):
    """On html spin update"""
    print("SpinApp: Received spin update", attrname, old, new, self.icon.spin)
    if self.icon.spin:
      time.sleep(5)
      self.load_plot()
      self.icon.spin = False
      self.set_children()
      curdoc().add(self)

  def load_plot(self):
    p = figure(title="random data")
    data_length = 100
    p.circle(np.arange(data_length), np.random.rand(data_length), size=5)
    self.plot = p

# The following code adds a "/bokeh/spin/" url to the bokeh-server.
@bokeh_app.route("/bokeh/spin/")
@object_page("spin")
def make_spin_app():
  return SpinApp.create()
