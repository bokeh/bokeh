from bokeh import mpl
import numpy as np
import datetime
import time
p = mpl.PlotClient()
x = np.arange(100) / 6.0
y = np.sin(x)
z = np.cos(x)
data_source = p.make_source(idx=range(100), x=x, y=y, z=z)
p.plot(x, y, 'orange')
p.figure()
p.plot('x', 'y', color='blue', data_source=data_source, title='sincos')
p.plot('x', 'z', color='green')
p.figure()
p.plot('x', 'y', data_source=data_source)
p.figure()
p.plot('x', 'z', data_source=data_source)
p.figure()
p.table(data_source, ['x', 'y', 'z'])
p.scatter('x', 'y', data_source=data_source)
p.figure()
p.scatter('x', 'z', data_source=data_source)
p.figure()
p.hold(False)
p.scatter('x', 'y', 'orange', data_source=data_source)
p.scatter('x', 'z', 'red', data_source=data_source)
p.plot('x', 'z', 'yellow', data_source=data_source)
p.plot('x', 'y', 'black', data_source=data_source)
# from webplot import p as newp
# newp.ic.set('children', p.ic.get('children'))
# newp.bbclient.upsert_all(p.models.values())
# newp.bbclient.update(newp.ic)

p.htmldump("foo.html")

