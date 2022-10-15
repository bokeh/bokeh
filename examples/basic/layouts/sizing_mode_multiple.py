import numpy as np

from bokeh.layouts import column, row
from bokeh.models import ColumnDataSource, CustomJS, Div, Slider
from bokeh.plotting import figure, show

x = np.linspace(0, 10, 500)
y = np.sin(x)

source = ColumnDataSource(data=dict(x=x, y=y))

plot = figure(y_range=(-10, 10), width=400, height=200, background_fill_color="#fafafa", sizing_mode="stretch_both")

plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

amp = Slider(start=0.1, end=10, value=1, step=.1, title="Amplitude", sizing_mode="stretch_both")
freq = Slider(start=0.1, end=10, value=1, step=.1, title="Frequency", sizing_mode="stretch_both")
phase = Slider(start=0, end=6.4, value=0, step=.1, title="Phase", sizing_mode="stretch_both")
offset = Slider(start=-5, end=5, value=0, step=.1, title="Offset", sizing_mode="stretch_both")

widgets = column(amp, freq, phase, offset, sizing_mode="fixed", height=250, width=150)

callback = CustomJS(args=dict(source=source, amp=amp, freq=freq, phase=phase, offset=offset),
                    code="""
    const A = amp.value
    const k = freq.value
    const phi = phase.value
    const B = offset.value

    const x = source.data.x
    const y = Array.from(x, (x) => B + A*Math.sin(k*x+phi))
    source.data = { x, y }
""")

amp.js_on_change('value', callback)
freq.js_on_change('value', callback)
phase.js_on_change('value', callback)
offset.js_on_change('value', callback)

heading = Div(sizing_mode="stretch_width", height=80, text="In this wave example, the sliders on the left "
 "can be used to change the amplitude, frequency, phase, and offset of the wave.")

layout = column(heading, row(widgets, plot), sizing_mode="stretch_both")

show(layout)
