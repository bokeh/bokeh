from bokeh import mpl
p = mpl.PlotClient('defaultuser',
                   serverloc='http://localhost:5006',
                   userapikey='nokey')
p.use_doc('main')
import numpy as np
import datetime
import time
import pandas
import cPickle as pickle
import tempfile
import random

length = 1000

types = ['a','a','b','c','c','d','d']
types2 = ['cat','dog','cat','dog','cat','dog','cat']
vals = [4,5,2,3,10,9,8]
alphabet = ['a','b','c','d','e','f','g','h','i','j']
def word(index):
    index = str(index)
    output = ""
    for ind in index:
        output += alphabet[int(ind)]
    return output

df = pandas.DataFrame(
    dict(
        types=[random.choice(types) for x in range(length)],
        types2=[random.choice(types2) for x in range(length)],
        types3=[random.choice(types2) for x in range(length)],
        vals=[random.choice(vals) for x in range(length)],
        vals2=np.random.randn(length),
        ),
    index=[word(x) for x in range(length)]
    )
p.clearic()
table = p.pandastable(df)
table.pivotmodel.set('precision', {'vals2' : 5})
p.bbclient.update(table.pivotmodel)
pandassource = table.pivotmodel.pandassource

plotsource = p.model('PandasPlotSource', pandassourceobj=pandassource)
p.bbclient.create(plotsource)
plot = p.scatter('vals', 'vals2', data_source=plotsource)



