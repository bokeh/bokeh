from __future__ import print_function

import numpy as np

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models import (
    ColumnDataSource, DataRange1d, Plot, Circle, WidgetBox, Row, Button, TapTool
)

document = Document()
session = push_session(document)


N = 9

x = np.linspace(-2, 2, N)
y = x**2

source1 = ColumnDataSource(dict(x = x, y = y, size = [20]*N))
xdr1 = DataRange1d()
ydr1 = DataRange1d()
plot1 = Plot(x_range=xdr1, y_range=ydr1, plot_width=400, plot_height=400)
plot1.title.text = "Plot1"
plot1.tools.append(TapTool(plot=plot1))
plot1.add_glyph(source1, Circle(x="x", y="y", size="size", fill_color="red"))

source2 = ColumnDataSource(dict(x = x, y = y, color = ["blue"]*N))
xdr2 = DataRange1d()
ydr2 = DataRange1d()
plot2 = Plot(x_range=xdr2, y_range=ydr2, plot_width=400, plot_height=400)
plot2.title.text = "Plot2"
plot2.tools.append(TapTool(plot=plot2))
plot2.add_glyph(source2, Circle(x="x", y="y", size=20, fill_color="color"))

def on_selection_change1(attr, _, inds):
    color = ["blue"]*N
    if inds['1d']['indices']:
        indices = inds['1d']['indices']
        for i in indices:
            color[i] = "red"
    source2.data["color"] = color

source1.on_change('selected', on_selection_change1)

def on_selection_change2(attr, _, inds):
    inds = inds['1d']['indices']
    if inds:
        [index] = inds
        size = [10]*N
        size[index] = 40
    else:
        size = [20]*N
    source1.data["size"] = size

source2.on_change('selected', on_selection_change2)

reset = Button(label="Reset")

def on_reset_click():
    source1.selected = {
        '0d': {'flag': False, 'indices': []},
        '1d': {'indices': []},
        '2d': {'indices': []}
    }
    source2.selected = {
        '0d': {'flag': False, 'indices': []},
        '1d': {'indices': []},
        '2d': {'indices': []}
    }

reset.on_click(on_reset_click)

widgetBox = WidgetBox(children=[reset], width=150)
row = Row(children=[widgetBox, plot1, plot2])

document.add_root(row)
session.show(row)

if __name__ == "__main__":
    document.validate()
    print("\npress ctrl-C to exit")
    session.loop_until_closed()
