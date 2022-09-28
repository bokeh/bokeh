''' An plot of two interactive sliders. The values are updated
simultaneously as the slider bars are dragged to different values.
This example demonstrates how ``CustomJS`` callbacks react to user
interaction events.

.. bokeh-example-metadata::
    :apis: bokeh.layouts.column, bokeh.models.callbacks.CustomJS
    :refs: :ref:`ug_interaction_js_callbacks_customjs_js_on_event`
    :keywords: javascript callback

'''
from bokeh.io import show
from bokeh.layouts import column
from bokeh.models import CustomJS, Div, Slider

para = Div(text="<h1>Slider Values:</h1><p>Slider 1: 0<p>Slider 2: 0<p>Slider 3: 0")

s1 = Slider(title="Slider 1 (Continuous)", start=0, end=1000, value=0, step=1)
s2 = Slider(title="Slider 3 (Mouse Up)", start=0, end=1000, value=0, step=1)

callback = CustomJS(args=dict(para=para, s1=s1, s2=s2), code="""
    para.text = "<h1>Slider Values</h1><p>Slider 1: " + s1.value  + "<p>Slider 2: " + s2.value
""")

s1.js_on_change('value', callback)
s2.js_on_change('value_throttled', callback)

show(column(s1, s2, para))
