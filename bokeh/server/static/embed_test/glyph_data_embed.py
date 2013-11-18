
import os

from bokeh.sampledata.iris import flowers
from bokeh.objects import (
    Plot, DataRange1d, LinearAxis, Grid, ColumnDataSource, Glyph, PanTool, ZoomTool
)
from bokeh.glyphs import Circle
from bokeh import session

from numpy import pi, arange, sin, cos
import numpy as np
import os.path

from bokeh.objects import (Plot, DataRange1d, LinearAxis, 
        ColumnDataSource, Glyph, ObjectArrayDataSource,
        PanTool, ZoomTool)
from bokeh.glyphs import Circle
from bokeh import session


colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}

flowers['color'] = flowers['species'].map(lambda x: colormap[x])

source = ColumnDataSource(
    data=dict(
        petal_length=flowers['petal_length'],
        petal_width=flowers['petal_width'],
        sepal_length=flowers['sepal_length'],
        sepal_width=flowers['sepal_width'],
        color=flowers['color']
    )
)

xdr = DataRange1d(sources=[source.columns("petal_length")])
ydr = DataRange1d(sources=[source.columns("petal_width")])

circle = Circle(x="petal_length", y="petal_width", fill_color="color", fill_alpha=0.2, radius=5, line_color="color")

glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], border=80, title="Iris Data")
xaxis = LinearAxis(plot=plot, dimension=0, location="min",
        axis_label="petal length", bounds=(1,7), major_tick_in=0)
yaxis = LinearAxis(plot=plot, dimension=1, location="min",
        axis_label="petal width", bounds=(0,2.5), major_tick_in=0)
xgrid = Grid(plot=plot, dimension=0)
ygrid = Grid(plot=plot, dimension=1)

pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,zoomtool]

sess = session.HTMLFileSession("iris.html")
sess.add(plot, glyph_renderer, xaxis, yaxis, xgrid, ygrid, source, xdr, ydr, pantool, zoomtool)
sess.plotcontext.children.append(plot)
inject_1 =  plot.script_direct_inject()
from numpy import pi, arange, sin, cos
import numpy as np
import os.path

from bokeh.objects import (Plot, DataRange1d, LinearAxis, 
        ObjectArrayDataSource, ColumnDataSource, Glyph,
        PanTool, ZoomTool)
from bokeh.glyphs import Line
from bokeh import session

x = np.linspace(-2*pi, 2*pi, 1000)
y = sin(x)
z = cos(x)
widths = np.ones_like(x) * 0.02
heights = np.ones_like(x) * 0.2

source = ColumnDataSource(data=dict(x=x,y=y,z=z,widths=widths,
            heights=heights))

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

line_glyph = Line(x="x", y="y", line_color="blue")

renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = line_glyph
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source], 
        border=50)
xaxis = LinearAxis(plot=plot, dimension=0, location="bottom")
yaxis = LinearAxis(plot=plot, dimension=1, location="left")

pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(renderer)
plot.tools = [pantool, zoomtool]

sess = session.HTMLFileSession("line.html")
sess.add(plot, renderer, xaxis, yaxis, source, xdr, ydr, pantool, zoomtool)
sess.plotcontext.children.append(plot)

inject_2 =  plot.script_direct_inject()
print inject_1
print inject_2

html  = '''
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">

<!--    <script 
       type="text/javascript" 
       src="http://localhost:5006/bokeh/static/js/application.js"></script>
-->
  </head>
  <body>
%s %s
  </body>
</html>''' % (inject_1, inject_2)

with open('glyph_data_embed.html', 'w') as f:
    f.write(html)



# sess.plotcontext.children.append(plot)
# sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))
# sess.dumpjson(file="glyph1.json")
# print "Wrote glyph1.html"
# try:
#     import webbrowser
#     webbrowser.open("file://" + os.path.abspath("glyph1.html"))
# except:
#     pass
