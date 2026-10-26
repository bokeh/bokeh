"""Select probability distributions stored in an HDF5 file."""

import os
from os.path import dirname, join
from threading import Lock

import h5py

from bokeh.layouts import row
from bokeh.models import ColumnDataSource, Select
from bokeh.plotting import figure
from bokeh.server.asgi import BokehASGI

DATA_LOCK = Lock()


def modify_document(doc):
    app_dir = dirname(__file__)

    with DATA_LOCK:
        if 'demo_data.hdf5' not in os.listdir(app_dir):
            from .create_hdf5 import generate_data
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
    inputs = data_select
    update()
    doc.add_root(row(inputs, p, width=1100))
    doc.title = "Simple HDF5"


app = BokehASGI(modify_document)
