'''Demonstrates how to modify a ``Legend`` to have multiple columns or rows by setting an
explicit value for ``ncols`` and ``nrows``.

.. bokeh-example-metadata::
    :apis: bokeh.plotting.figure.line
    :refs: :ref:`ug_basic_annotations_legends_two_dimensions`
    :keywords: legend
'''
import numpy as np

from bokeh.layouts import column
from bokeh.plotting import figure, show

x = np.linspace(0, 4*np.pi, 100)
sinx = np.sin(x)

p1 = figure(title='Default legend layout', width=500, height=300)
[p1.line(x, (1 + i/20)*sinx, legend_label=f"{1+i/20:.2f}*sin(x)") for i in range(7)]

p2 = figure(title='Legend layout with 2 columns', width=500, height=300)
[p2.line(x, (1 + i/20)*sinx, legend_label=f"{1+i/20:.2f}*sin(x)") for i in range(7)]
p2.legend.ncols=2

p3 = figure(title='Legend layout with 3 rows', width=500, height=300)
[p3.line(x, (1 + i/20)*sinx, legend_label=f"{1+i/20:.2f}*sin(x)") for i in range(7)]
p3.legend.nrows=3

show(column(p1, p2, p3))
