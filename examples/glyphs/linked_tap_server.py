from __future__ import print_function

import numpy as np

from bokeh.models import ColumnDataSource, DataRange1d, Plot, LinearAxis, Grid, Circle, VBox, HBox, Button, TapTool
from bokeh.document import Document
from bokeh.session import Session
from bokeh.browserlib import view

document = Document()
session = Session()
session.use_doc('linked_tap_server')
session.load_document(document)

N = 9

x = np.linspace(-2, 2, N)
y = x**2

source1 = ColumnDataSource(dict(x = x, y = y, size = [20]*N))
xdr1 = DataRange1d(sources=[source1.columns("x")])
ydr1 = DataRange1d(sources=[source1.columns("y")])
plot1 = Plot(title="Plot1", x_range=xdr1, y_range=ydr1, plot_width=400, plot_height=400)
plot1.tools.append(TapTool(plot=plot1))
plot1.add_glyph(source1, Circle(x="x", y="y", size="size", fill_color="red"))

source2 = ColumnDataSource(dict(x = x, y = y, color = ["blue"]*N))
xdr2 = DataRange1d(sources=[source2.columns("x")])
ydr2 = DataRange1d(sources=[source2.columns("y")])
plot2 = Plot(title="Plot2", x_range=xdr2, y_range=ydr2, plot_width=400, plot_height=400)
plot2.tools.append(TapTool(plot=plot2))
plot2.add_glyph(source2, Circle(x="x", y="y", size=20, fill_color="color"))

def on_selection_change1(obj, attr, _, inds):
    color = ["blue"]*N
    if inds:
        [index] = inds
        color[index] = "red"
    source2.data["color"] = color
    session.store_objects(source2)

source1.on_change('selected', on_selection_change1)

def on_selection_change2(obj, attr, _, inds):
    if inds:
        [index] = inds
        size = [10]*N
        size[index] = 40
    else:
        size = [20]*N
    source1.data["size"] = size
    session.store_objects(source1)

source2.on_change('selected', on_selection_change2)

reset = Button(label="Reset")

def on_reset_click():
    source1.selected = []
    source2.selected = []
    session.store_objects(source1, source2)

reset.on_click(on_reset_click)

vbox = VBox(children=[reset], width=150)
hbox = HBox(children=[vbox, plot1, plot2])

document.add(hbox)
session.store_document(document)

if __name__ == "__main__":
    link = session.object_link(document.context)
    print("Please visit %s to see the plots" % link)
    view(link)
    print("\npress ctrl-C to exit")
    session.poll_document(document)
