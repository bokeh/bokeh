from __future__ import print_function

import time

from bokeh.objects import ColumnDataSource, Plot, DataRange1d, LinearAxis, Grid, Glyph, BoxSelectTool, BoxSelectionOverlay
from bokeh.glyphs import Circle
from bokeh.widgets import TableColumn, HandsonTable, Select, HBox, VBox
from bokeh.document import Document
from bokeh.session import Session
from bokeh.sampledata.autompg2 import autompg2 as mpg

class DataTables(object):

    def __init__(self):
        self.document = Document()
        self.session = Session()
        self.session.use_doc('data_tables_server')
        self.session.load_document(self.document)

        self.manufacturer_filter = None
        self.model_filter = None
        self.transmission_filter = None
        self.drive_filter = None
        self.class_filter = None

        self.source = ColumnDataSource()
        self.update_data()

        self.document.add(self.create())
        self.session.store_document(self.document)

    def create(self):
        manufacturers = sorted(mpg["manufacturer"].unique())
        models = sorted(mpg["model"].unique())
        transmissions = sorted(mpg["trans"].unique())
        drives = sorted(mpg["drv"].unique())
        classes = sorted(mpg["class"].unique())

        manufacturer_select = Select(title="Manufacturer:", value="All", options=["All"] + manufacturers)
        manufacturer_select.on_change('value', self.on_manufacturer_change)
        model_select = Select(title="Model:", value="All", options=["All"] + models)
        model_select.on_change('value', self.on_model_change)
        transmission_select = Select(title="Transmission:", value="All", options=["All"] + transmissions)
        transmission_select.on_change('value', self.on_transmission_change)
        drive_select = Select(title="Drive:", value="All", options=["All"] + drives)
        drive_select.on_change('value', self.on_drive_change)
        class_select = Select(title="Class:", value="All", options=["All"] + classes)
        class_select.on_change('value', self.on_class_change)

        columns = [
            TableColumn(field="manufacturer", header="Manufacturer", type="autocomplete", source=manufacturers),
            TableColumn(field="model", header="Model", type="autocomplete", source=models),
            TableColumn(field="displ", header="Displacement", type="numeric", format="0.00"),
            TableColumn(field="year", header="Year", type="numeric"),
            TableColumn(field="cyl", header="Cylinders", type="numeric"),
            TableColumn(field="trans", header="Transmission", type="dropdown", strict=True, source=transmissions),
            TableColumn(field="drv", header="Drive", type="autocomplete", strict=True, source=drives),
            TableColumn(field="class", header="Class", type="autocomplete", strict=True, source=classes),
            TableColumn(field="cty", header="City MPG", type="numeric"),
            TableColumn(field="hwy", header="Highway MPG", type="numeric"),
        ]
        handson_table = HandsonTable(source=self.source, columns=columns, sorting=True)

        xdr = DataRange1d(sources=[self.source.columns("index")])
        #xdr = FactorRange(factors=manufacturers)
        ydr = DataRange1d(sources=[self.source.columns("cty"), self.source.columns("hwy")])
        plot = Plot(title=None, data_sources=[self.source], x_range=xdr, y_range=ydr, plot_width=800, plot_height=300)
        xaxis = LinearAxis(plot=plot)
        plot.below.append(xaxis)
        yaxis = LinearAxis(plot=plot)
        ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)
        plot.left.append(yaxis)
        cty = Glyph(data_source=self.source, glyph=Circle(x="index", y="cty", fill_color="green"))
        hwy = Glyph(data_source=self.source, glyph=Circle(x="index", y="hwy", fill_color="red"))
        select_tool = BoxSelectTool(renderers=[cty, hwy], select_y=False)
        plot.tools.append(select_tool)
        overlay = BoxSelectionOverlay(tool=select_tool)
        plot.renderers.extend([cty, hwy, ygrid, overlay])

        controls = VBox(children=[manufacturer_select, model_select, transmission_select, drive_select, class_select], width=200)
        top_panel = HBox(children=[controls, plot])
        layout = VBox(children=[top_panel, handson_table])

        return layout

    def on_manufacturer_change(self, obj, attr, _, value):
        self.manufacturer_filter = None if value == "All" else value
        self.update_data()

    def on_model_change(self, obj, attr, _, value):
        self.model_filter = None if value == "All" else value
        self.update_data()

    def on_transmission_change(self, obj, attr, _, value):
        self.transmission_filter = None if value == "All" else value
        self.update_data()

    def on_drive_change(self, obj, attr, _, value):
        self.drive_filter = None if value == "All" else value
        self.update_data()

    def on_class_change(self, obj, attr, _, value):
        self.class_filter = None if value == "All" else value
        self.update_data()

    def update_data(self):
        df = mpg
        if self.manufacturer_filter:
            df = df[df["manufacturer"] == self.manufacturer_filter]
        if self.model_filter:
            df = df[df["model"] == self.model_filter]
        if self.transmission_filter:
            df = df[df["trans"] == self.transmission_filter]
        if self.drive_filter:
            df = df[df["drv"] == self.drive_filter]
        if self.class_filter:
            df = df[df["class"] == self.class_filter]
        self.source.data = ColumnDataSource.from_df(df)
        self.session.store_document(self.document)

    def run(self, do_view=False, poll_interval=0.5):
        link = self.session.object_link(self.document.context)
        print("Please visit %s to see the plots" % link)
        if do_view: view(link)
        print("\npress ctrl-C to exit")
        session.poll_document(document)

if __name__ == "__main__":
    data_tables = DataTables()
    data_tables.run(True)
