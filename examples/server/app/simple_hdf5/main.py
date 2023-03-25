''' A simple chart visualizing hdf5 files.

.. note::
    This example needs the hdf5 library to run.

'''
import os
from os.path import dirname, join

import h5py

from bokeh.io import curdoc
from bokeh.layouts import row
from bokeh.models import ColumnDataSource, Select
from bokeh.plotting import figure

app_dir = dirname(__file__)

if 'demo_data.hdf5' not in os.listdir(app_dir):
    import sys
    sys.path.append(app_dir)
    from create_hdf5 import generate_data
    generate_data(app_dir)


options = ['Gaussian', 'Exponential', 'Chi Square', 'Alpha', 'Beta']
data_select = Select(title="Distribution:", value=options[0],
                     options=options)

source = ColumnDataSource(data=dict(x=[], y=[]))

p = figure(height=600, width=800, title="", toolbar_location=None)
p.line(x="x", y="y", source=source, line_width=2)
p.background_fill_color = "#efefef"


def select_data():
    data_val = data_select.value
    with h5py.File(join(app_dir, 'demo_data.hdf5'), 'r') as f:
        return f[data_val]['x'][:], f[data_val]['pdf'][:]


def update():
    x, y = select_data()
    source.data = dict(x=x, y=y)


data_select.on_change('value', lambda attr, old, new: update())

# TODO: panel(data_select, width=300)
inputs = data_select

update()

curdoc().add_root(row(inputs, p, width=1100))
curdoc().title = "Simple HDF5"
