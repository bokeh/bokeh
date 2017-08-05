from bokeh.models import CustomJS, Select, WidgetBox, Column, ColumnDataSource
from bokeh.models.transforms import LinearInterpolator, StepInterpolator
from bokeh.plotting import figure, show, output_file

N = 600

controls = ColumnDataSource(data=dict(x=[1, 2, 3, 4, 5], y=[2, 8, 7, 3, 5]))
source = ColumnDataSource(data=dict(x=[], y=[]))

linear = LinearInterpolator(x='x', y='y', data=controls)
step = StepInterpolator(x='x', y='y', data=controls)

p = figure(x_range=(0, 6), y_range=(0, 10))
p.circle(x='x', y='y', source=controls, size=15, alpha=0.5, color="firebrick")
p.circle(x='x', y='y', source=source, size=1, alpha=0.2, color="navy")

callback = CustomJS(args=dict(source=source, linear=linear, step=step), code="""
    var mode = cb_obj.value;
    var data = source.data;
    var dx = 6 / %d;

    if (mode == 'None') {
        data['x'] = [];
        data['y'] = [];
    }
    else {
        if (mode == 'Linear') { interp = linear; }
        else if (mode == 'Step (before)') { interp = step; step.mode = 'before'; }
        else if (mode == 'Step (center)') { interp = step; step.mode = 'center'; }
        else if (mode == 'Step (after)')  { interp = step; step.mode = 'after';  }

        for (i=0; i < %d; i++) {
            data['x'][i] = i * dx
            data['y'][i] = interp.compute(data['x'][i])
        }
    }

    source.change.emit()

""" % (N, N))

mode = Select(
    title='Interpolation Mode',
    value='None',
    options=['None', 'Linear', 'Step (before)', 'Step (center)', 'Step (after)'],
    callback=callback)
output_file("transform_interpolator.html", title="Example Transforms")

show(Column(WidgetBox(mode,width=300), p))
