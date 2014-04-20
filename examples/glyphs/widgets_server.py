from __future__ import print_function

import sys
import requests
from datetime import date

from bokeh.widgetobjects import HBox, VBox, TableColumn, HandsonTable, ObjectExplorer
from bokeh.objects import Plot, ColumnDataSource, DataRange1d, Glyph, LinearAxis, DatetimeAxis, Grid, HoverTool
from bokeh.glyphs import Line, Circle
from bokeh.session import PlotServerSession

def make_plot():
    source = ColumnDataSource(dict(
        dates  = [ date(2014, 3, i) for i in [1, 2, 3, 4, 5] ],
        downloads = [100, 27, 54, 64, 75],
    ))
    xdr = DataRange1d(sources=[source.columns("dates")])
    ydr = DataRange1d(sources=[source.columns("downloads")])
    plot = Plot(title="Product downloads", data_sources=[source], x_range=xdr, y_range=ydr, width=400, height=400)
    line = Line(x="dates", y="downloads", line_color="blue")
    line_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=line)
    plot.renderers.append(line_glyph)
    circle = Circle(x="dates", y="downloads", fill_color="red")
    circle_glyph = Glyph(data_source=source, xdata_range=xdr, ydata_range=ydr, glyph=circle)
    plot.renderers.append(circle_glyph)
    hover = HoverTool(plot=plot, tooltips=dict(downloads="@downloads"))
    plot.tools.append(hover)
    xaxis = DatetimeAxis(plot=plot, dimension=0)
    yaxis = LinearAxis(plot=plot, dimension=1)
    xgrid = Grid(plot=plot, dimension=0, axis=xaxis)
    ygrid = Grid(plot=plot, dimension=1, axis=yaxis)
    return plot, source

def make_ui():
    plot, source = make_plot()
    columns = [
        TableColumn(data="dates", type="date", header="Date"),
        TableColumn(data="downloads", type="numeric", header="Downloads"),
    ]
    data_table = HandsonTable(source=source, columns=columns)
    obj_explorer = ObjectExplorer(data_widget=data_table)
    vbox = VBox(children=[plot, data_table])
    hbox = HBox(children=[obj_explorer, vbox])
    return hbox

try:
    session = PlotServerSession(serverloc="http://localhost:5006", username="defaultuser", userapikey="nokey")
except requests.exceptions.ConnectionError:
    print("ERROR: This example requires the plot server. Please make sure plot server is running, by executing 'bokeh-server'")
    sys.exit(1)

session.use_doc('widgets_server')
session.add_plot(make_ui())
session.store_all()

if __name__ == "__main__":
    print("\nPlease visit http://localhost:5006/bokeh to see the plots")
