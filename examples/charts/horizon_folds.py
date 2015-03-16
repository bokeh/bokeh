from collections import OrderedDict

import numpy as np

from bokeh.charts import Horizon, output_file, show

x = np.linspace(0, np.pi*4, 137)
y = (2*np.random.normal(size=137) + x**2)
xx = np.hstack([-1*x[::-1], x])
yy = np.hstack([-1*y[::-1], y])

xyvalues = OrderedDict(x=xx, y=yy, y2=yy, y3=yy, y4=yy, y5=yy)

output_file("horizon_folds.html")

hp = Horizon(xyvalues, index='x', title="test horizon", ylabel='Random')

show(hp)

