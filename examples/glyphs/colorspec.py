""" Demonstrates data-dependent color """

import os.path
from bokeh.objects import (Plot, DataRange1d, LinearAxis, 
        ColumnDataSource, Glyph, ObjectArrayDataSource,
        PanTool, ZoomTool)
from bokeh.glyphs import Circle
from bokeh import session

source = ObjectArrayDataSource(
    data = [
        {'x' : 1, 'y' : 5, 'z':3, "color":"rgb(0,100,120)"},
        {'x' : 2, 'y' : 4, 'z':3, "color":"green", "radius":10},
        {'x' : 3, 'y' : 3, 'z':3, "color":"blue"},
        {'x' : 4, 'y' : 2, 'z':3},
        {'x' : 5, 'y' : 1, 'z':3, "color": "rgba(120,230,150,0.5)"},
        ])

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

circle = Circle(x="x", y="y", radius=5,
    # Set the fill color to be dependent on the "color" field of the
    # datasource.  If the field is missing, then the default value is
    # used. Since no explicit default is provided, this picks up the
    # default in FillProps, which is "gray".
    fill_color="color", 
    
    # An alternative form that explicitly sets a default value:
    #fill_color={"default": "red", "field": "color"},
    
    # Note that line_color is set to a fixed value. This can be any of
    # the SVG named 147 colors, or a hex color string starting with "#",
    # or a string "rgb(r,g,b)" or "rgba(r,g,b,a)".
    # Any other string will be interpreted as a field name to look up
    # on the datasource.
    line_color="black")

glyph_renderer = Glyph(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )

plot = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
        border= 80)
xaxis = LinearAxis(plot=plot, dimension=0, location="min")
yaxis = LinearAxis(plot=plot, dimension=1, location="min")

pantool = PanTool(dataranges = [xdr, ydr], dimensions=["width","height"])
zoomtool = ZoomTool(dataranges=[xdr,ydr], dimensions=("width","height"))

plot.renderers.append(glyph_renderer)
plot.tools = [pantool,zoomtool]

FILENAME="colorspec.html"

sess = session.HTMLFileSession(FILENAME)
sess.add(plot, glyph_renderer, xaxis, yaxis, source, xdr, ydr, pantool, zoomtool)
sess.plotcontext.children.append(plot)
sess.save(js="relative", css="relative", rootdir=os.path.abspath("."))
print "Wrote " + FILENAME
try:
    import webbrowser
    webbrowser.open("file://" + os.path.abspath(FILENAME))
except:
    pass
