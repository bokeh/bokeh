
from bokeh.plotting import figure, output_file, show, vplot, ColumnDataSource
from bokeh.models.actions import Callback
from bokeh.models.widgets import Slider

import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

source = ColumnDataSource(data=dict(x=x, y=y, y_orig=y))

plot = figure(y_range=(-20, 20))
plot.line('x', 'y', source=source)

callback = Callback(args=dict(source=source), code="""
    var data = source.get('data');
    var val = cb_obj.get('value')
    data['y'] = Bokeh._.map(data['y_orig'], function(y){ return y*val; });
    source.trigger('change');
""")

slider = Slider(start=1, end=20, value=1, step=1, title="Foo", callback=callback)

layout = vplot(slider, plot)

output_file("slider.html")

show(layout)
