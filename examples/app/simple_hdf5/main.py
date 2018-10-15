import os
from os.path import dirname, join

import h5py

from bokeh.io import curdoc
from bokeh.layouts import row, widgetbox
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import Select
from bokeh.plotting import figure

parent_dir = dirname(__file__)

if 'demo_data.hdf5' not in os.listdir(parent_dir):
    import sys
    sys.path.append(parent_dir)
    from create_hdf5 import generate_data
    generate_data(parent_dir)


options = ['Gaussian', 'Exponential', 'Chi Square']
data_select = Select(title="Output:", value=options[0],
                     options=options)

source = ColumnDataSource(data=dict(x=[], y=[]))

p = figure(plot_height=600, plot_width=800, title="", toolbar_location=None)
p.line(x="x", y="y", source=source, line_width=2)
p.background_fill_color = "#efefef"


def select_data():
    data_val = data_select.value
    with h5py.File(join(parent_dir, 'demo_data.hdf5'), 'r') as f:
        return f[data_val]['x'][:], f[data_val]['pdf'][:]


def update():
    x, y = select_data()
    source.data = dict(x=x, y=y)


data_select.on_change('value', lambda attr, old, new: update())

inputs = widgetbox(data_select, width=300)

update()

curdoc().add_root(row(inputs, p, width=1100))
curdoc().title = "Simple HDF5"
