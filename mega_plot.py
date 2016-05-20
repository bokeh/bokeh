import numpy as np

from bokeh.io import vform
from bokeh.models import CustomJS, Slider, Row, Column, ColumnDataSource
from bokeh.plotting import figure, hplot, output_file, show

from scipy.integrate import odeint

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

    p.title = 'Bollinger Bands'
    p.plot_height = 600
    p.plot_width = 800
    p.grid.grid_line_alpha = 0.4
    return p


def slider():
    x = np.linspace(0, 10, 500)
    y = np.sin(x)

    source = ColumnDataSource(data=dict(x=x, y=y))

    plot = figure(y_range=(-10, 10), tools='', toolbar_location=None)
    plot.line('x', 'y', source=source, line_width=3, line_alpha=0.6)

    callback = CustomJS(args=dict(source=source), code="""
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

    amp_slider = Slider(start=0.1, end=10, value=1, step=.1, title="Amplitude", callback=callback, callback_policy='mouseup')
    callback.args["amp"] = amp_slider

    freq_slider = Slider(start=0.1, end=10, value=1, step=.1, title="Frequency", callback=callback)
    callback.args["freq"] = freq_slider

    phase_slider = Slider(start=0, end=6.4, value=0, step=.1, title="Phase", callback=callback)
    callback.args["phase"] = phase_slider

    offset_slider = Slider(start=-5, end=5, value=0, step=.1, title="Offset", callback=callback)
    callback.args["offset"] = offset_slider

    layout = hplot(vform(amp_slider, freq_slider, phase_slider, offset_slider), plot)
    return layout


def linked_panning():
    N = 100
    x = np.linspace(0, 4 * np.pi, N)
    y1 = np.sin(x)
    y2 = np.cos(x)
    y3 = np.sin(x) + np.cos(x)

    s1 = figure(tools=tools, toolbar_location='right')
    s1.circle(x, y1, color="navy", size=8, alpha=0.5)
    s2 = figure(tools=tools, toolbar_location='right', x_range=s1.x_range, y_range=s1.y_range)
    s2.circle(x, y2, color="firebrick", size=8, alpha=0.5)
    s3 = figure(tools='pan, box_select', toolbar_location='right', x_range=s1.x_range)
    s3.circle(x, y3, color="olive", size=8, alpha=0.5)
    layout = Row(s1, s2, s3)
    return layout


def linked_brushing():
    N = 300
    x = np.linspace(0, 4 * np.pi, N)
    y1 = np.sin(x)
    y2 = np.cos(x)

    source = ColumnDataSource(data=dict(x=x, y1=y1, y2=y2))
    s1 = figure(tools='pan, box_select', toolbar_location='right', min_border=5)
    s1.circle('x', 'y1', line_color=None, fill_alpha=0.6, source=source)
    s2 = figure(tools='pan, box_select', toolbar_location='right', x_range=s1.x_range, y_range=s1.y_range)
    s2.circle('x', 'y2', line_color=None, fill_alpha=0.6, source=source)

    return (s1, s2)


def lorenz():
    sigma = 10
    rho = 28
    beta = 8.0 / 3
    theta = 3 * np.pi / 4

    def lor(xyz, t):
        x, y, z = xyz
        x_dot = sigma * (y - x)
        y_dot = x * rho - x * z - y
        z_dot = x * y - beta * z
        return [x_dot, y_dot, z_dot]

    initial = (-10, -7, 35)
    t = np.arange(0, 100, 0.006)
    solution = odeint(lor, initial, t)
    x = solution[:, 0]
    y = solution[:, 1]
    z = solution[:, 2]
    xprime = np.cos(theta) * x - np.sin(theta) * y
    colors = ["#C6DBEF", "#9ECAE1", "#6BAED6", "#4292C6", "#2171B5", "#08519C", "#08306B"]
    p = figure(title="lorenz example", tools='', toolbar_location=None)
    p.multi_line(np.array_split(xprime, 7), np.array_split(z, 7), line_color=colors, line_alpha=0.8, line_width=1.5)

    return p


def lorez_and_linked():
    return Row(lorenz(), *linked_brushing())

#output_file('megaplot_1.html')
#show(Column(bollinger(), slider(), lorez_and_linked()))

output_file('megaplot_2.html')
show(Column(bollinger(), slider(), linked_panning()))
