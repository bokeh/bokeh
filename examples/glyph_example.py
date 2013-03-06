from bokeh import mpl
from bokeh.bbmodel import make_model
p = mpl.PlotClient('defaultuser',
                   serverloc='http://localhost:5006',
                   userapikey='nokey')
p.use_doc('glyph')
import numpy as np
import datetime
import time

source = make_model(
    'ObjectArrayDataSource',
    data = [
        {'x' : 1, 'y' : 5, 'z':3, 'radius':10},
        {'x' : 2, 'y' : 4, 'z':3},
        {'x' : 3, 'y' : 3, 'z':3, 'color':"red"},
        {'x' : 4, 'y' : 2, 'z':3},
        {'x' : 5, 'y' : 1, 'z':3},
        ]
    )
plot = make_model('Plot')
xdr = make_model(
    'DataRange1d', 
    sources = [{'ref' : source.ref(), 'columns' : ['x']}]
    )

ydr = make_model(
    'DataRange1d', 
    sources=[{'ref' : source.ref(), 'columns' : ['y']}],
    )
glyph_renderer = make_model(
    'GlyphRenderer',
    data_source = source.ref(),
    xdata_range = xdr.ref(),
    ydata_range = ydr.ref(),
    glyphspec = {
        'type' : 'circle',
        'fill' : 'blue',
        'radius' : {
            'field' : 'radius',
            'default' : 5,
            },
        'units' : 'screen',
        'x' : 'x',
        'y' : 'y'
        }
    )         

xaxis = make_model(
    'LinearAxis', 
    orientation='bottom',
    parent=plot.ref(),
    data_range=xdr.ref()
    )

yaxis = make_model(
    'LinearAxis', 
    orientation='left',
    parent=plot.ref(),
    data_range=ydr.ref()
    )
plot.set('renderers', [glyph_renderer.ref()])
plot.set('axes', [xaxis.ref(), yaxis.ref()])

p.bbclient.upsert_all([source, plot, xdr, ydr, glyph_renderer, xaxis, yaxis])
p.show(plot)



                   
                                            
