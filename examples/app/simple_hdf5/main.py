from os.path import dirname, join

import numpy as np
import h5py

from bokeh.io import curdoc
from bokeh.layouts import row, widgetbox
from bokeh.models import ColumnDataSource
from bokeh.models.widgets import Select
from bokeh.plotting import figure

data_select = Select(title="Output:", value="hip_strength", options=["hip_strength", "knee_strength"])

source = ColumnDataSource(data=dict(x=[], y=[]))

p = figure(plot_height=600, plot_width=800, title="", toolbar_location=None)
p.line(x="x", y="y", source=source)

# Fast direct read from hdf5
def get_data(f, name):
    shape = f[name].shape
    # Empty array
    data = np.empty(shape, dtype=np.float64)
    # read_direct to empty arrays
    f[name].read_direct(data)
    return data

def select_data():
    data_val = data_select.value
    with h5py.File(join(dirname(__file__), 'demo_data.hdf5'), 'r') as f:
        return get_data(f, data_val)

def update():
    # hardcoded length of 100
    x = list(range(1, 101))
    y = select_data()

    source.data = dict(x=x, y=y)

data_select.on_change('value', lambda attr, old, new: update())

inputs = widgetbox(data_select, width=300)

update()

curdoc().add_root(row(inputs, p, width=1100))
curdoc().title = "Simple HDF5"
