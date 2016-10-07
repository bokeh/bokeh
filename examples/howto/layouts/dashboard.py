import numpy as np

from bokeh.layouts import layout
from bokeh.models import CustomJS, Slider, ColumnDataSource, WidgetBox
from bokeh.plotting import figure, output_file, show

output_file('dashboard.html')

tools = 'pan'


def bollinger():
    # Define Bollinger Bands.
    upperband = np.random.random_integers(100, 150, size=100)
    lowerband = upperband - 100
    x_data = np.arange(1, 101)

    # Bollinger shading glyph:
    band_x = np.append(x_data, x_data[::-1])
    band_y = np.append(lowerband, upperband[::-1])

    p = figure(x_axis_type='datetime', tools=tools)
    p.patch(band_x, band_y, color='#7570B3', fill_alpha=0.2)

    p.title.text = 'Bollinger Bands'
    p.title_location = 'left'
    p.title.align = 'left'
    p.plot_height = 600
    p.plot_width = 800
    p.grid.grid_line_alpha = 0.4
    return [p]


def slider():
    x = np.linspace(0, 10, 100)
    y = np.sin(x)

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = figure(
        y_range=(-10, 10), tools='', toolbar_location=None,
        title="Sliders example")
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

    callback = CustomJS(args=dict(source=source), code="""
        var data = source.data;
        var A = amp.value;
        var k = freq.value;
        var phi = phase.value;
        var B = offset.value;
        x = data['x']
        y = data['y']
        for (i = 0; i < x.length; i++) {
            y[i] = B + A*Math.sin(k*x[i]+phi);
        }
        source.trigger('change');
    """)

    amp_slider = Slider(start=0.1, end=10, value=1, step=.1, title="Amplitude", callback=callback, callback_policy='mouseup')
    callback.args["amp"] = amp_slider

    freq_slider = Slider(start=0.1, end=10, value=1, step=.1, title="Frequency", callback=callback)
    callback.args["freq"] = freq_slider

    phase_slider = Slider(start=0, end=6.4, value=0, step=.1, title="Phase", callback=callback)
    callback.args["phase"] = phase_slider

    offset_slider = Slider(start=-5, end=5, value=0, step=.1, title="Offset", callback=callback)
    callback.args["offset"] = offset_slider

    widgets = WidgetBox(amp_slider, freq_slider, phase_slider, offset_slider)
    return [widgets, plot]


def linked_panning():
    N = 100
    x = np.linspace(0, 4 * np.pi, N)
    y1 = np.sin(x)
    y2 = np.cos(x)
    y3 = np.sin(x) + np.cos(x)

    s1 = figure(tools=tools)
    s1.circle(x, y1, color="navy", size=8, alpha=0.5)
    s2 = figure(tools=tools, x_range=s1.x_range, y_range=s1.y_range)
    s2.circle(x, y2, color="firebrick", size=8, alpha=0.5)
    s3 = figure(tools='pan, box_select', x_range=s1.x_range)
    s3.circle(x, y3, color="olive", size=8, alpha=0.5)
    return [s1, s2, s3]

l = layout([
    bollinger(),
    slider(),
    linked_panning(),
], sizing_mode='stretch_both')

show(l)
