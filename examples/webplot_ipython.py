from cdxlib import mpl
import numpy as np
import datetime
import time
p = mpl.PlotClient()
p.notebooksources()
x = np.arange(100) / 6.0
y = np.sin(x)
z = np.cos(x)
data_source = p.make_source(idx=range(100), x=x, y=y, z=z)
plot = p.plot('x', 'y', 'orange', data_source=data_source)
plot.notebook()
p.figure()
plot = p.plot('x', 'z', 'blue', data_source=data_source)
p.figure()
plot.notebook()

plot1 = p.plot('x', 'y', 'orange', data_source=data_source)
p.figure()
plot2 = p.plot('x', 'z', 'blue', data_source=data_source)
p.figure()
grid = p.grid([[plot1,plot2]])
grid.notebook()
grid.htmldump('grid.html')
