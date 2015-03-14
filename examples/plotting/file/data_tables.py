from bokeh.plotting import output_file, show
from bokeh.models import ColumnDataSource, DataRange1d, Plot, LinearAxis, Grid, GlyphRenderer, Circle, HoverTool, BoxSelectTool
from bokeh.models.widgets import VBox, DataTable, TableColumn, StringFormatter, NumberFormatter, StringEditor, IntEditor, NumberEditor, SelectEditor
from bokeh.sampledata.autompg2 import autompg2 as mpg

output_file('data_tables.html', title='Data Tables')

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
data_table = DataTable(source=source, columns=columns, editable=True)

# TODO: rewrite this using plotting API {{{
xdr = DataRange1d()
ydr = DataRange1d()
plot = Plot(title=None, x_range=xdr, y_range=ydr, plot_width=1000, plot_height=300)
xaxis = LinearAxis(plot=plot)
plot.below.append(xaxis)
yaxis = LinearAxis(plot=plot)
ygrid = Grid(plot=plot, dimension=1, ticker=yaxis.ticker)
plot.left.append(yaxis)
cty_glyph = Circle(x="index", y="cty", fill_color="#396285", size=8, fill_alpha=0.5, line_alpha=0.5)
hwy_glyph = Circle(x="index", y="hwy", fill_color="#CE603D", size=8, fill_alpha=0.5, line_alpha=0.5)
cty = GlyphRenderer(data_source=source, glyph=cty_glyph)
hwy = GlyphRenderer(data_source=source, glyph=hwy_glyph)
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
cty_hover_tool = HoverTool(plot=plot, renderers=[cty], tooltips=tooltips + [("City MPG", "@cty")])
hwy_hover_tool = HoverTool(plot=plot, renderers=[hwy], tooltips=tooltips + [("Highway MPG", "@hwy")])
select_tool = BoxSelectTool(plot=plot, renderers=[cty, hwy], dimensions=['width'])
plot.tools.extend([cty_hover_tool, hwy_hover_tool, select_tool])
plot.renderers.extend([cty, hwy, ygrid])
# }}}

layout = VBox(plot, data_table)

show(layout)
