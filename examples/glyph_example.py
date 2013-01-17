from bokeh import mpl
from bokeh.bbmodel import ContinuumModel
p = mpl.PlotClient('defaultdoc', 'http://localhost:5006', 'nokey')
import numpy as np
import datetime
import time

source = ContinuumModel(
    'ObjectArrayDataSource',
    data = [
        {'x' : 1, 'y' : 5, 'z':3, 'radius':10},
        {'x' : 2, 'y' : 4, 'z':3},
        {'x' : 3, 'y' : 3, 'z':3, 'color':"red"},
        {'x' : 4, 'y' : 2, 'z':3},
        {'x' : 5, 'y' : 1, 'z':3},
        ]
    )
plot = ContinuumModel('Plot')
xdr = ContinuumModel(
    'DataRange1d', 
    sources = [{'ref' : source.ref(), 'columns' : ['x']}]
    )

ydr = ContinuumModel(
    'DataRange1d', 
    sources=[{'ref' : source.ref(), 'columns' : ['y']}],
    )
glyph_renderer = ContinuumModel(
    'GlyphRenderer',
    data_source = source.ref(),
    xdata_range = xdr.ref(),
    ydata_range = ydr.ref(),
    scatter_size = 10,
    color = 'black',
    x = 'x',
    y = 'y',
    glyphs = [{'type' : 'circles',
               'color' : 'blue'}]
    )         

xaxis = ContinuumModel(
    'LinearAxis', 
    orientation='bottom',
    parent=plot.ref(),
    data_range=xdr.ref()
    )

yaxis = ContinuumModel(
    'LinearAxis', 
    orientation='left',
    parent=plot.ref(),
    data_range=ydr.ref()
    )
plot.set('renderers', [glyph_renderer.ref()])
plot.set('axes', [xaxis.ref(), yaxis.ref()])

p.bbclient.upsert_all([source, plot, xdr, ydr, glyph_renderer, xaxis, yaxis])
p.show(plot)



                   
                                            
