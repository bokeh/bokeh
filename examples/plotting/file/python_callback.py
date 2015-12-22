"""
Version of slider example that uses a Python function as a callback,
which is transpiled to JavaScript using PyScript. Read more on PyScript
here: http://flexx.readthedocs.org/en/latest/pyscript/index.html
"""

from bokeh.io import vform
from bokeh.plotting import figure, hplot, output_file, show, ColumnDataSource
from bokeh.models import CustomJS, Slider

import numpy as np

x = np.linspace(0, 10, 500)
y = np.sin(x)

source = ColumnDataSource(data=dict(x=x, y=y))

plot = figure(y_range=(-10, 10), plot_width=400, plot_height=400)
plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)


def callback(source=source):
    data = source.get('data')
    A, B = amp.get('value'), offset.get('value')
    k, phi = freq.get('value'), phase.get('value')
    x, y = data['x'], data['y']
    for i in range(len(x)):
        y[i] = B + A * Math.sin(k * x[i] + phi)
    source.trigger('change')

# Turn our function into a CustomJS object
callback = CustomJS.from_py_func(callback)

# uncomment the line below to see the generated JavaScript
# print(callback.code)

amp_slider = Slider(start=0.1, end=10, value=1, step=.1, title="Amplitude", callback=callback)
callback.args["amp"] = amp_slider

freq_slider = Slider(start=0.1, end=10, value=1, step=.1, title="Frequency", callback=callback)
callback.args["freq"] = freq_slider

phase_slider = Slider(start=0, end=6.4, value=0, step=.1, title="Phase", callback=callback)
callback.args["phase"] = phase_slider

offset_slider = Slider(start=-5, end=5, value=0, step=.1, title="Offset", callback=callback)
callback.args["offset"] = offset_slider

layout = hplot(
    plot,
    vform(amp_slider, freq_slider, phase_slider, offset_slider),
)

output_file("python_callback.html")

show(layout)
