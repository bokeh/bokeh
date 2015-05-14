# The plot server must be running
# Go to http://localhost:5006/bokeh to view this plot

from bokeh.sampledata.iris import flowers
from bokeh.plotting import figure, show, output_server

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}
flowers['color'] = flowers['species'].map(lambda x: colormap[x])

output_server("iris")

p = figure(title = "Iris Morphology")
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Petal Width'

p.circle(flowers["petal_length"], flowers["petal_width"],
        color=flowers["color"], fill_alpha=0.2, size=10, )
show(p)
