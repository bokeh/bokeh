''' Flip a widget between on and off states.

.. bokeh-example-metadata::
    :title: On/off switch
    :keywords: switch
    :apis: bokeh.models.CustomJS, bokeh.models.Div, bokeh.models.Switch
    :gallery: An enabled switch beside a label showing its current state.
'''

from bokeh.io import show
from bokeh.layouts import row
from bokeh.models import CustomJS, Div, Switch

switch = Switch(label="Toggle state:", active=True)
div = Div()
switch.js_on_change("active", CustomJS(args=dict(div=div), code="""
    const state = this.active ? "ON" : "OFF"
    div.text = `Current state: ${state}`
"""))
show(row([switch, div]))
