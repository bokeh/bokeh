from bokeh.document import Document
from bokeh.models import ColumnDataSource, DataRange1d, Plot, LinearAxis, Grid, Circle, HoverTool, BoxSelectTool
from bokeh.models.widgets import DataTable, TableColumn, StringFormatter, NumberFormatter, StringEditor, IntEditor, NumberEditor, SelectEditor
from bokeh.models.layouts import Column
from bokeh.embed import file_html
from bokeh.resources import INLINE
from bokeh.util.browser import view
from bokeh.sampledata.autompg2 import autompg2 as mpg

source = ColumnDataSource(mpg)

manufacturers = sorted(mpg["manufacturer"].unique())
models = sorted(mpg["model"].unique())
transmissions = sorted(mpg["trans"].unique())
drives = sorted(mpg["drv"].unique())
classes = sorted(mpg["class"].unique())

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
data_table = DataTable(source=source, columns=columns, editable=True, width=1000)

plot = Plot(title=None, x_range= DataRange1d(), y_range=DataRange1d(), plot_width=1000, plot_height=300)

# Set up x & y axis
plot.add_layout(LinearAxis(), 'below')
yaxis = LinearAxis()
plot.add_layout(yaxis, 'left')
plot.add_layout(Grid(dimension=1, ticker=yaxis.ticker))

# Add Glyphs
cty_glyph = Circle(x="index", y="cty", fill_color="#396285", size=8, fill_alpha=0.5, line_alpha=0.5)
hwy_glyph = Circle(x="index", y="hwy", fill_color="#CE603D", size=8, fill_alpha=0.5, line_alpha=0.5)
cty = plot.add_glyph(source, cty_glyph)
hwy = plot.add_glyph(source, hwy_glyph)

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

layout = Column(plot, data_table)

doc = Document()
doc.add_root(layout)

if __name__ == "__main__":
    doc.validate()
    filename = "data_tables.html"
    with open(filename, "w") as f:
        f.write(file_html(doc, INLINE, "Data Tables"))
    print("Wrote %s" % filename)
    view(filename)
