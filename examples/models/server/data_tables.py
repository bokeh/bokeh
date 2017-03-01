from __future__ import print_function

from bokeh.client import push_session
from bokeh.document import Document
from bokeh.models import (
    ColumnDataSource, DataRange1d, Plot, LinearAxis, Grid,
    Circle, HoverTool, BoxSelectTool
)
from bokeh.models.widgets import (
    Select, DataTable, TableColumn, StringFormatter,
    NumberFormatter, StringEditor, IntEditor, NumberEditor, SelectEditor)
from bokeh.models.layouts import Row, Column, WidgetBox
from bokeh.sampledata.autompg2 import autompg2 as mpg

class DataTables(object):

    def __init__(self):
        self.document = Document()
        self.manufacturer_filter = None
        self.model_filter = None
        self.transmission_filter = None
        self.drive_filter = None
        self.class_filter = None

        self.source = ColumnDataSource()
        self.update_data()

        self.document.add_root((self.create()))
        self.session = push_session(self.document)

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
            TableColumn(field="manufacturer", title="Manufacturer", editor=SelectEditor(options=manufacturers), formatter=StringFormatter(font_style="bold")),
            TableColumn(field="model",        title="Model",        editor=StringEditor(completions=models)),
            TableColumn(field="displ",        title="Displacement", editor=NumberEditor(step=0.1),              formatter=NumberFormatter(format="0.0")),
            TableColumn(field="year",         title="Year",         editor=IntEditor()),
            TableColumn(field="cyl",          title="Cylinders",    editor=IntEditor()),
            TableColumn(field="trans",        title="Transmission", editor=SelectEditor(options=transmissions)),
            TableColumn(field="drv",          title="Drive",        editor=SelectEditor(options=drives)),
            TableColumn(field="class",        title="Class",        editor=SelectEditor(options=classes)),
            TableColumn(field="cty",          title="City MPG",     editor=IntEditor()),
            TableColumn(field="hwy",          title="Highway MPG",  editor=IntEditor()),
        ]
        data_table = DataTable(source=self.source, columns=columns, editable=True, width=1300)

        plot = Plot(title=None, x_range= DataRange1d(), y_range=DataRange1d(), plot_width=1000, plot_height=300)

        # Set up x & y axis
        plot.add_layout(LinearAxis(), 'below')
        yaxis = LinearAxis()
        plot.add_layout(yaxis, 'left')
        plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

        # Add Glyphs
        cty_glyph = Circle(x="index", y="cty", fill_color="#396285", size=8, fill_alpha=0.5, line_alpha=0.5)
        hwy_glyph = Circle(x="index", y="hwy", fill_color="#CE603D", size=8, fill_alpha=0.5, line_alpha=0.5)
        cty = plot.add_glyph(self.source, cty_glyph)
        hwy = plot.add_glyph(self.source, hwy_glyph)

        # Add the tools
        tooltips = [
            ("Manufacturer", "@manufacturer"),
            ("Model", "@model"),
            ("Displacement", "@displ"),
            ("Year", "@year"),
            ("Cylinders", "@cyl"),
            ("Transmission", "@trans"),
            ("Drive", "@drv"),
            ("Class", "@class"),
        ]
        cty_hover_tool = HoverTool(renderers=[cty], tooltips=tooltips + [("City MPG", "@cty")])
        hwy_hover_tool = HoverTool(renderers=[hwy], tooltips=tooltips + [("Highway MPG", "@hwy")])
        select_tool = BoxSelectTool(renderers=[cty, hwy], dimensions='width')
        plot.add_tools(cty_hover_tool, hwy_hover_tool, select_tool)

        controls = WidgetBox(manufacturer_select, model_select, transmission_select, drive_select, class_select)
        top_panel = Row(controls, plot)
        layout = Column(top_panel, data_table)

        return layout

    def on_manufacturer_change(self, attr, _, value):
        self.manufacturer_filter = None if value == "All" else value
        self.update_data()

    def on_model_change(self, attr, _, value):
        self.model_filter = None if value == "All" else value
        self.update_data()

    def on_transmission_change(self, attr, _, value):
        self.transmission_filter = None if value == "All" else value
        self.update_data()

    def on_drive_change(self, attr, _, value):
        self.drive_filter = None if value == "All" else value
        self.update_data()

    def on_class_change(self, attr, _, value):
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

    def run(self, do_view=False, poll_interval=0.5):
        if do_view:
            self.session.show()

        self.session.loop_until_closed()

if __name__ == "__main__":
    data_tables = DataTables()
    data_tables.document.validate()
    data_tables.run(True)
