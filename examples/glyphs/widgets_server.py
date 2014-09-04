from __future__ import print_function

import time

from datetime import date
from random import randint

from requests.exceptions import ConnectionError

from bokeh.browserlib import view
from bokeh.document import Document
from bokeh.glyphs import Line, Circle
from bokeh.objects import (
    Plot, ColumnDataSource, DataRange1d,
    LinearAxis, DatetimeAxis, Grid, HoverTool
)
from bokeh.session import Session
from bokeh.widgets import VBox, HBox, Paragraph, Button, Toggle, CheckboxButtons, RadioButtons, TableColumn, HandsonTable

document = Document()
session = Session()
session.use_doc('widgets_server')
session.load_document(document)

def make_data():
    n = randint(5, 10)
    return dict(
        dates=[ date(2014, 3, i+1) for i in range(n) ],
        downloads=[ randint(0, 100) for i in range(n) ],
    )

source = ColumnDataSource(make_data())

def make_plot():
    xdr = DataRange1d(sources=[source.columns("dates")])
    ydr = DataRange1d(sources=[source.columns("downloads")])

    plot = Plot(title="Product downloads", x_range=xdr, y_range=ydr, plot_width=400, plot_height=400)

    line = Line(x="dates", y="downloads", line_color="blue")
    plot.add_glyph(source, xdr, ydr, line)

    circle = Circle(x="dates", y="downloads", fill_color="red")
    plot.add_glyph(source, xdr, ydr, circle)

    xaxis = DatetimeAxis()
    plot.add_layout(xaxis, 'below')

    yaxis = LinearAxis()
    plot.add_layout(yaxis, 'left')

    plot.add_layout(Grid(dimension=0, ticker=xaxis.ticker))
    plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

    plot.add_tools(HoverTool(tooltips=dict(downloads="@downloads")))

    return plot, source

def click_handler():
    source.data = make_data()
    session.store_document(document)

def make_layout():
    plot, source = make_plot()
    columns = [
        TableColumn(field="dates", type="date", header="Date"),
        TableColumn(field="downloads", type="numeric", header="Downloads"),
    ]
    data_table = HandsonTable(source=source, columns=columns)
    button = Button(text="Randomize data", type="success")
    button.on_click(click_handler)
    buttons = VBox(children=[button])
    vbox = VBox(children=[buttons, plot, data_table])
    return vbox

document.add(make_layout())
session.store_document(document)

if __name__ == "__main__":
    link = session.object_link(document.context)
    print("Please visit %s to see the plots" % link)

    try:
        while True:
            session.load_document(document)
            time.sleep(0.5)
    except KeyboardInterrupt:
        print()
    except ConnectionError:
        print("Connection to bokeh-server was terminated")
