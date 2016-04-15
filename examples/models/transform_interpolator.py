import numpy as np

from bokeh.io import vplot, hplot
from bokeh.core.properties import NumberSpec
from bokeh.plotting import figure, show, output_file
from bokeh.models.sources import ColumnDataSource
from bokeh.models import CustomJS, TextInput, Select, Div
from bokeh.models.transforms import LinearInterpolator, StepInterpolator

N = 1000
low = 0
high = 100
source = ColumnDataSource(data=dict(x=np.linspace(low, high, num=N), y=[None]*N))
interp_source = ColumnDataSource(data=dict(x=[0,100], y=[0,50]))

linterp = LinearInterpolator(x='x', y='y', data=interp_source)
sinterp = StepInterpolator(x='x', y='y', data=interp_source)

p = figure(x_range=(low, high), y_range=(low, high))
p.line(x='x', y='y', source=source)
p.circle(x='x', y='y', source=interp_source)

interpolation_settings_callback=CustomJS(args=dict(interp_source=interp_source, source=source, linterp=linterp, sinterp=sinterp, figure=p), code="""
    xvals = xvals_entry.get('value')
    yvals = yvals_entry.get('value')

    xvals = eval(xvals)
    yvals = eval(yvals)

    if(xvals.length == yvals.length) {
        if(xvals.length >= 2) {
            interp_source.get('data')['x'] = xvals
            interp_source.get('data')['y'] = yvals
        }
    }

    interp_source.trigger('change')
    linterp.trigger('change')
    sinterp.trigger('change')

    interp = 0

    if(interp_select.get('value') == 'Linear') {
      interp = linterp
    }

    if(interp_select.get('value') == 'Step') {
      sinterp.set('mode', stepmode_select.get('value').toLowerCase())
      interp = sinterp
    }

    Array.prototype.max = function() {
      return Math.max.apply(null, this);
    };

    Array.prototype.min = function() {
      return Math.min.apply(null, this);
    };

    N = source.get('data')['x'].length
    sxvals = Array.apply(0, Array(N)).map(function(_,b) { return b + 1; })
    width = xvals.max() - xvals.min()
    for (i=0; i < sxvals.length; i++) {
        sxvals[i] = xvals.min() + (sxvals[i]/(N/width))
    }

    var data=source.get('data')
    for (i=0; i < data['y'].length; i++) {
        data['x'][i] = sxvals[i]
        data['y'][i] = interp.compute(data['x'][i])
    }

    source.trigger('change')
    figure.trigger('change')

""")

xvals = TextInput(title='Control Point X:', value = '[0, 100]', callback=interpolation_settings_callback)
yvals = TextInput(title='Control Point Y:', value = '[0, 50]', callback=interpolation_settings_callback)
interp_select = Select(title='Interpolation Method', value='Linear', options=['Linear', 'Step'], callback=interpolation_settings_callback)
stepmode_select = Select(title='Step Mode', value='After', options=['Before', 'Center', 'After'], callback=interpolation_settings_callback)

interpolation_settings_callback.args['xvals_entry'] = xvals
interpolation_settings_callback.args['yvals_entry'] = yvals
interpolation_settings_callback.args['interp_select'] = interp_select
interpolation_settings_callback.args['stepmode_select'] = stepmode_select

title = Div(text='<H1>Interpolation Parameters</H1>', height=None)

output_file("transform_interpolator.html", title="Example Transforms")

show(hplot(p, vplot(title, interp_select, xvals, yvals, stepmode_select)))
