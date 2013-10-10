
from numpy import pi, arange, sin, cos
import numpy as np
import os.path

from bokeh.objects import (Plot, DataRange1d, LinearAxis, 
        ColumnDataSource, GlyphRenderer, ObjectArrayDataSource,
        PanTool, ZoomTool)
from bokeh.glyphs import Circle
from bokeh import session

x = arange(-2*pi, 2*pi, 0.1)
y = sin(x)
z = cos(x)
widths = np.ones_like(x) * 0.02
heights = np.ones_like(x) * 0.2


#source = ColumnDataSource(data=dict(x=x,y=y,z=z,widths=widths,
#            heights=heights))

source = ObjectArrayDataSource(
    data = [
        {'x' : 1, 'y' : 5, 'z':3},
        {'x' : 2, 'y' : 4, 'z':3, 'radius':10},
        {'x' : 3, 'y' : 3, 'z':3},
        {'x' : 4, 'y' : 2, 'z':3},
        {'x' : 5, 'y' : 1, 'z':3},
        ])

xdr = DataRange1d(sources=[source.columns("x")])
ydr = DataRange1d(sources=[source.columns("y")])

circle = Circle(x="x", y="y", fill_color="red", radius=5, line_color="black")

glyph_renderer = GlyphRenderer(
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

glyph_renderer = GlyphRenderer(
        data_source = source,
        xdata_range = xdr,
        ydata_range = ydr,
        glyph = circle,
        )

plot2 = Plot(x_range=xdr, y_range=ydr, data_sources=[source],
        border= 80)
xaxis = LinearAxis(plot=plot, dimension=0, location="min")
yaxis = LinearAxis(plot=plot, dimension=1, location="min")



sess = session.HTMLFileSession("glyph1.html")
sess.add(plot, glyph_renderer, xaxis, yaxis, source, xdr, ydr, pantool, zoomtool)
inject_1 =  plot.script_direct_inject()
print inject_1
sess.add(plot2, glyph_renderer, xaxis, yaxis, source, xdr, ydr, pantool, zoomtool)
inject_2 = plot2.script_direct_inject()
print inject_2

html  = '''
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <script 
       type="text/javascript" 
       src="http://localhost:5006/bokeh/static/js/application.js"></script>
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
