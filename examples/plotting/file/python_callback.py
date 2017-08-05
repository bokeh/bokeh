""" Version of slider example that uses a Python function as a callback,
which is transpiled to JavaScript using PyScript. Read more on PyScript
here:

    http://flexx.readthedocs.org/en/stable/pyscript

"""

import numpy as np

from bokeh. layouts import row, widgetbox
from bokeh.plotting import figure, output_file, show, ColumnDataSource
from bokeh.models import CustomJS, Slider

x = np.linspace(0, 10, 500)
y = np.sin(x)

source = ColumnDataSource(data=dict(x=x, y=y))

plot = figure(y_range=(-10, 10), plot_width=400, plot_height=400)

plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

def callback(source=source, window=None, amp=None, freq=None, phase=None, offset=None):
    data = source.data
    A, B = amp.value, offset.value
    k, phi = freq.value, phase.value
    x, y = data['x'], data['y']
    for i in range(len(x)):
        y[i] = B + A * window.Math.sin(k * x[i] + phi)
    source.change.emit()

# turn our function into a CustomJS object.
# print(callback.code) to see the generated JavaScript code
callback = CustomJS.from_py_func(callback)

amp_slider = Slider(start=0.1, end=10, value=1, step=.1,
                    title="Amplitude", callback=callback)
callback.args["amp"] = amp_slider

freq_slider = Slider(start=0.1, end=10, value=1, step=.1,
                     title="Frequency", callback=callback)
callback.args["freq"] = freq_slider

phase_slider = Slider(start=0, end=6.4, value=0, step=.1,
                      title="Phase", callback=callback)
callback.args["phase"] = phase_slider

offset_slider = Slider(start=-5, end=5, value=0, step=.1,
                       title="Offset", callback=callback)
callback.args["offset"] = offset_slider

layout = row(
    plot,
    widgetbox(amp_slider, freq_slider, phase_slider, offset_slider),
)

output_file("python_callback.html", title="python_callback.py example")

show(layout)
