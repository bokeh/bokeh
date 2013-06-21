from bokeh import mpl
p = mpl.PlotClient('defaultuser',
                   serverloc='http://localhost:5006',
                   userapikey='nokey')
p.use_doc('main')

import numpy as np
import datetime
import time
x = np.arange(100) / 6.0
y = np.sin(x)
z = np.cos(x)
data_source = p.make_source(idx=range(100), x=x, y=y, z=z)
ab = p.plot(x, y, 'orange')

print ab.script_inject()
