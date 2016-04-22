import numpy as np

from bokeh.charts import Horizon, output_file, show

x = np.linspace(0, np.pi*4, 137)
y = (2*np.random.normal(size=137) + x**2)
xx = np.hstack([-1*x[::-1], x])
yy = np.hstack([-1*y[::-1], y])

data = dict([
    ('x', xx), ('y', yy), ('y2', yy),
    ('y3', yy), ('y4', yy), ('y5', yy)
])

hp = Horizon(data, x='x', title="test horizon", ylabel='Random')

output_file("horizon_folds.html", title="horizon_folds.py example")

show(hp)
