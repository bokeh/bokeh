from bokeh.plotting import output_file, show
from bokeh.models import (ColumnDataSource, TableColumn, DataTable, DataRange1d,
    Plot, LinearAxis, Grid, GlyphRenderer, Circle, BoxSelectTool, VBox)
from bokeh.sampledata.autompg2 import autompg2 as mpg

output_file('data_tables.html', title='Data Tables')

source = ColumnDataSource(mpg)

columns = [
    TableColumn(field="manufacturer", title="Manufacturer"),
    TableColumn(field="model", title="Model"),
    TableColumn(field="displ", title="Displacement"),
    TableColumn(field="year", title="Year"),
    TableColumn(field="cyl", title="Cylinders"),
    TableColumn(field="trans", title="Transmission"),
    TableColumn(field="drv", title="Drive"),
    TableColumn(field="class", title="Class"),
    TableColumn(field="cty", title="City MPG"),
    TableColumn(field="hwy", title="Highway MPG"),
]
data_table = DataTable(source=source, columns=columns, width=1000, height=500)

# TODO: rewrite this using plotting API {{{
xdr = DataRange1d(sources=[source.columns("index")])
ydr = DataRange1d(sources=[source.columns("cty"), source.columns("hwy")])
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
select_tool = BoxSelectTool(plot=plot, renderers=[cty, hwy], dimensions=['width'])
plot.tools.append(select_tool)
plot.renderers.extend([cty, hwy, ygrid])
# }}}

layout = VBox(plot, data_table)

show(layout)
