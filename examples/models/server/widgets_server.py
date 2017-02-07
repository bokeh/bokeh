from __future__ import print_function

from datetime import date
from random import randint

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models.glyphs import Line, Circle
from bokeh.models import (
    Plot, ColumnDataSource, DataRange1d,
    LinearAxis, DatetimeAxis, Grid, HoverTool
)
from bokeh.models.widgets import (
    Button, TableColumn, DataTable,
    DateEditor, DateFormatter, IntEditor)
from bokeh.models.layouts import WidgetBox, Column

document = Document()
session = push_session(document)

def make_data():
    n = randint(5, 10)
    return dict(
        dates=[ date(2014, 3, i+1) for i in range(n) ],
        downloads=[ randint(0, 100) for i in range(n) ],
    )

source = ColumnDataSource(make_data())

def make_plot():
    xdr = DataRange1d()
    ydr = DataRange1d()

    plot = Plot(x_range=xdr, y_range=ydr, plot_width=400, plot_height=400)
    plot.title.text = "Product downloads"

    line = Line(x="dates", y="downloads", line_color="blue")
    plot.add_glyph(source, line)

    circle = Circle(x="dates", y="downloads", fill_color="red")
    plot.add_glyph(source, circle)

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

def make_layout():
    plot, source = make_plot()
    columns = [
        TableColumn(field="dates", title="Date", editor=DateEditor(), formatter=DateFormatter()),
        TableColumn(field="downloads", title="Downloads", editor=IntEditor()),
    ]
    data_table = DataTable(source=source, columns=columns, width=400, height=400, editable=True)
    button = Button(label="Randomize data", button_type="success")
    button.on_click(click_handler)
    buttons = WidgetBox(children=[button], width=400)
    column = Column(children=[buttons, plot, data_table])
    return column

layout = make_layout()
document.add_root(layout)

session.show(layout)

if __name__ == "__main__":
    document.validate()
    print("\npress ctrl-C to exit")
    session.loop_until_closed()
