""" The iris dataset, drawn twice with semi-transparent markers. This is
an interesting use-case to test blending, because several samples itself
overlap, and by drawing the set twice with different colors, we realize
even more interesting blending. Also note how this makes use of
different ways to specify (css) colors. This example is a good reference
to test WebGL blending.

"""

from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.iris import flowers

colormap1 = {'setosa': 'rgb(255, 0, 0)',
             'versicolor': 'rgb(0, 255, 0)',
             'virginica': 'rgb(0, 0, 255)'}
colors1 = [colormap1[x] for x in flowers['species']]

colormap2 = {'setosa': '#0f0', 'versicolor': '#0f0', 'virginica': '#f00'}
colors2 = [colormap2[x] for x in flowers['species']]

p = figure(title = "Iris Morphology", webgl=True)
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Petal Width'

p.diamond(flowers["petal_length"], flowers["petal_width"],
          color=colors1, line_alpha=0.5, fill_alpha=0.2, size=25, legend='diamonds')

p.circle(flowers["petal_length"], flowers["petal_width"],
         color=colors2, line_alpha=0.5, fill_alpha=0.2, size=10, legend='circles')

output_file("iris_blend.html", title="iris_blend.py example")

show(p)
