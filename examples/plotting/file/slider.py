
from bokeh.io import vform
from bokeh.plotting import figure, hplot, output_file, show, ColumnDataSource
from bokeh.models.actions import Callback
from bokeh.models.widgets import Slider

import numpy as np

x = np.linspace(0, 10, 500)
y = np.sin(x)

source = ColumnDataSource(data=dict(x=x, y=y))


plot = figure(y_range=(-10, 10), plot_width=400, plot_height=400)
plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

callback = Callback(args=dict(source=source), code="""
    var data = source.get('data');
    var A = amp.get('value')
    var k = freq.get('value')
    var phi = phase.get('value')
    var B = offset.get('value')
    x = data['x']
    y = data['y']
    for (i = 0; i < x.length; i++) {
        y[i] = B + A*Math.sin(k*x[i]+phi);
    }
    source.trigger('change');
""")

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

output_file("slider.html")

show(layout)
