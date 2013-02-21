from bokeh import mpl
p = mpl.PlotClient('defaultdoc', 'http://localhost:5006', 'nokey')
import numpy as np
import datetime
import time
import pandas
import cPickle as pickle
import tempfile

types = ['a','a','b','c','c','d','d']
vals = [4,5,2,3,10,9,8]
df = pandas.DataFrame(dict(types=types, vals=vals))
tempfile = tempfile.NamedTemporaryFile()
pickle.dump(df, tempfile)
tempfile.flush()
table = p.pandastable(tempfile.name)
