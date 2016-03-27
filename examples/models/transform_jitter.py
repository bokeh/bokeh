import numpy as np

from bokeh.io import vplot, hplot
from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import ColumnDataSource
from bokeh.models import Slider, CustomJS, Dropdown, Toggle, Paragraph
from bokeh.models.transforms import Jitter

N = 50
source = ColumnDataSource(data=dict(x=[1]*N + [2]*N, xp=[1]*N + [2]*N, xplot=[1]*N + [2]*N, col=['#ab324b']*N + ['#0022aa']*N, y=np.random.random(2*N)*10))

jitter = Jitter(mean=0, width=0)

p = figure(x_range=(-10,10), y_range=(0,10))
scatter_obj = p.scatter(x='xplot', y='y', color='col', source=source, size = 10, alpha=0.5)

enable_callback=CustomJS(args=dict(scatter_obj=scatter_obj, source=source, figure=p, jitter=jitter), code="""
    if(button.get('active') == true) {
        var data=source.get('data')
        for (i=0; i < data['y'].length; i++) {
            data['xplot'][i] = data['xp'][i]
        }
    } else {
        var data=source.get('data')
        for (i=0; i < data['y'].length; i++) {
            data['xplot'][i] = data['x'][i]
        }
    }
    source.trigger('change')
    figure.trigger('change')
""")

width_callback=CustomJS(args=dict(jitter=jitter, source=source, figure=p), code="""
    jitter.set('width', slider.get('value'))
    data=source.get('data')
    for (i=0; i < data['y'].length; i++) {
        data['xp'][i] = jitter.compute(data['x'][i])
    }
    if(button.get('active') == true) {
        var data=source.get('data')
        for (i=0; i < data['y'].length; i++) {
            data['xplot'][i] = data['xp'][i]
        }
    }
    source.trigger('change')
    figure.trigger('change')
""")

center_callback=CustomJS(args=dict(jitter=jitter, source=source, figure=p), code="""
    jitter.set('mean', slider.get('value'))
    data=source.get('data')
    for (i=0; i < data['y'].length; i++) {
        data['xp'][i] = jitter.compute(data['x'][i])
    }
    if(button.get('active') == true) {
        var data=source.get('data')
        for (i=0; i < data['y'].length; i++) {
            data['xplot'][i] = data['xp'][i]
        }
    }
    source.trigger('change')
    figure.trigger('change')
""")

distribution_callback=CustomJS(args=dict(jitter=jitter, source=source, figure=p), code="""
    jitter.set('distribution', menu.get('value'))
    data=source.get('data')
    for (i=0; i < data['y'].length; i++) {
        data['xp'][i] = jitter.compute(data['x'][i])
    }
    if(button.get('active') == true) {
        var data=source.get('data')
        for (i=0; i < data['y'].length; i++) {
            data['xplot'][i] = data['xp'][i]
        }
    }
    source.trigger('change')
    figure.trigger('change')
""")

enable_button = Toggle(label='Enable Jitter', type='success', callback=enable_callback)
enable_callback.args['button'] = enable_button

width_slider = Slider(start=0, end=2, value=0, step=0.01, title='Width', callback=width_callback, callback_policy='continuous')
width_callback.args['slider'] = width_slider
width_callback.args['button'] = enable_button

center_slider = Slider(start=-1, end=1, value=0, step=0.01, title='Center', callback=center_callback, callback_policy='continuous')
center_callback.args['slider'] = center_slider
center_callback.args['button'] = enable_button

distribution_dropdown = Dropdown(label='Distribution', type='success', menu=[('Uniform', 'uniform'), ('Normal', 'normal')], callback=distribution_callback)
distribution_callback.args['menu'] = distribution_dropdown
distribution_callback.args['button'] = enable_button

title = Paragraph(text='Jitter Parameters')
spacer = Paragraph(text=' ')

output_file("transforms.html", title="Example Transforms")

show(hplot(p, vplot(enable_button, spacer, title, spacer, center_slider, width_slider, distribution_dropdown)))
