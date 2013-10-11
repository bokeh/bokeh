
from bokeh.sampledata.iris import flowers
from bokeh.plotting import *

output_server("iris.py example")

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}

flowers['color'] = flowers['species'].map(lambda x: colormap[x])

scatter(flowers["petal_length"], flowers["petal_width"], color=flowers["color"], fill_alpha=0.2, radius=5)

# open a browser
show()
