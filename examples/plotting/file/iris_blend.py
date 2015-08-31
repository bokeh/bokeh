"""
The iris dataset, drawn twice with semi-transparent markers. This is
an interesting use-case to test blending, because several samples itself
overlap, and by drawing the set twice with different colors, we realize
even more interesting blending. Also note how this makes use of
different ways to specify (css) colors. This example is a good reference
to test WebGL blending.
"""

import numpy as np
from bokeh.sampledata.iris import flowers
from bokeh.plotting import figure, show, output_file

colormap1 = {'setosa': 'rgb(255, 0, 0)', 'versicolor': 'rgb(0, 255, 0)', 'virginica': 'rgb(0, 0, 255)'}
colormap2 = {'setosa': '#0f0', 'versicolor': '#0f0', 'virginica': '#f00'}
flowers1 = flowers.copy()
flowers2 = flowers.copy()

flowers1['color'] = flowers['species'].map(lambda x: colormap1[x])
flowers2['color'] = flowers['species'].map(lambda x: colormap2[x])

output_file("iris_blend.html", title="iris_blend.py example")

p = figure(title = "Iris Morphology", webgl=True)
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Petal Width'

p.diamond(flowers1["petal_length"], flowers1["petal_width"],
        color=flowers1["color"], line_alpha=0.5, fill_alpha=0.2, size=25, )

p.circle(flowers2["petal_length"], flowers2["petal_width"],
        color=flowers2["color"], line_alpha=0.5, fill_alpha=0.2, size=10, )

show(p)
