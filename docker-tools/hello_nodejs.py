# Bokeh imports
from bokeh.io import curdoc, show
from bokeh.models import ColumnDataSource, CustomJS
from bokeh.plotting import figure

source = ColumnDataSource(data=dict(x=[.5], y=[.5]))

p = figure(plot_width=400, plot_height=400,
           tools='tap', title='Click Below',
           x_range=(0.0, 1.0), y_range=(0.0, 1.0))

p.circle(x='x', y='y', size=20, source=source)

callback = CustomJS(args=dict(source=source), code="""
    // get data source from Callback args
    data = source.data;
    x = data['x']
    y = data['y']

    // update data source with new data
    x.push(cb_obj.x)
    y.push(cb_obj.y)

    // notify update of data source
    source.change.emit()
""")
p.js_on_event('tap', callback)

curdoc().add_root(p)
show(p)
