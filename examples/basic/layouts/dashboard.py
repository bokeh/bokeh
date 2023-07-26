import numpy as np

from bokeh.layouts import column, grid
from bokeh.models import ColumnDataSource, CustomJS, Slider
from bokeh.plotting import figure, show


def bollinger():
    upperband = np.random.randint(100, 150+1, size=100)
    lowerband = upperband - 100
    x_data = np.arange(1, 101)

    band_x = np.append(x_data, x_data[::-1])
    band_y = np.append(lowerband, upperband[::-1])

    p = figure(width=800, height=600, x_axis_type='datetime', tools='pan')
    p.patch(band_x, band_y, color='#7570B3', fill_alpha=0.2)

    p.title.text = 'Bollinger Bands'
    p.title_location = 'left'
    p.title.align = 'left'
    p.grid.grid_line_alpha = 0.4

    return [p]


def slider():
    x = np.linspace(0, 10, 100)
    y = np.sin(x)

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = figure(y_range=(-10, 10), tools='', toolbar_location=None,
                  title="Sliders example")
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

    amp = Slider(start=0.1, end=10, value=1, step=.1, title="Amplitude")
    freq = Slider(start=0.1, end=10, value=1, step=.1, title="Frequency")
    phase = Slider(start=0, end=6.4, value=0, step=.1, title="Phase")
    offset = Slider(start=-5, end=5, value=0, step=.1, title="Offset")

    callback = CustomJS(args=dict(source=source, amp=amp, freq=freq, phase=phase, offset=offset),
                        code="""
        const A = amp.value
        const k = freq.value
        const phi = phase.value
        const B = offset.value

        const x = source.data.x
        const y = Array.from(x, (x) => B + A*Math.sin(k*x+phi))
        source.data = {x, y}
    """)

    amp.js_on_change('value', callback)
    freq.js_on_change('value', callback)
    phase.js_on_change('value', callback)
    offset.js_on_change('value', callback)

    widgets = column(amp, freq, phase, offset, sizing_mode="stretch_width")

    return [widgets, plot]


def linked_panning():
    x = np.linspace(0, 4 * np.pi, 100)
    y1 = np.sin(x)
    y2 = np.cos(x)
    y3 = np.sin(x) + np.cos(x)

    s1 = figure(tools='pan')
    s1.scatter(x, y1, color="navy", size=8, alpha=0.5)

    s2 = figure(tools='pan', x_range=s1.x_range, y_range=s1.y_range)
    s2.scatter(x, y2, color="firebrick", size=8, alpha=0.5)

    s3 = figure(tools='pan, box_select', x_range=s1.x_range)
    s3.scatter(x, y3, color="olive", size=8, alpha=0.5)

    return [s1, s2, s3]

l = grid([bollinger(), slider(), linked_panning()],
         sizing_mode='stretch_both')

show(l)
