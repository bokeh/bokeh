
from bokeh.sampledata.iris import flowers
from bokeh.plotting import *

output_cloud("iris")

colormap = {'setosa': 'red', 'versicolor': 'green', 'virginica': 'blue'}

flowers['color'] = flowers['species'].map(lambda x: colormap[x])

scatter(flowers["petal_length"], flowers["petal_width"], color=flowers["color"], fill_alpha=0.2, size=10)

# open a browser
show()
