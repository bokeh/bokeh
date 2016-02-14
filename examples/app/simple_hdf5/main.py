import numpy as np
import h5py

from bokeh.plotting import Figure
from bokeh.models import ColumnDataSource, HBox, VBoxForm
from bokeh.models.widgets import Select
from bokeh.io import curdoc

data_select = Select(title="Output:", value="hip_strength", options=["hip_strength", "knee_strength"])

source = ColumnDataSource(data=dict(x=[], y=[]))

p = Figure(plot_height=600, plot_width=800, title="", toolbar_location=None)
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
    with h5py.File('myfile.hdf5', 'r') as f:
        return get_data(f, data_val)


def update(attrname, old, new):
    # hardcoded length of 100
    x = list(range(1, 101))
    y = select_data()

    source.data = dict(x=x, y=y)


data_select.on_change('value', update)

inputs = HBox(VBoxForm(data_select), width=300)

update(None, None, None)

curdoc().add_root(HBox(inputs, p, width=1100))
