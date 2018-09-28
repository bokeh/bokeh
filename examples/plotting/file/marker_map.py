from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.iris import flowers
from bokeh.transform import factor_cmap, factor_marker

SPECIES = ['setosa', 'versicolor', 'virginica']
MARKERS = ['hex', 'circle_x', 'triangle']

p = figure(title = "Iris Morphology")

p.scatter("petal_length", "petal_width", source=flowers, legend="species", fill_alpha=0.4, size=12,
          marker=factor_marker('species', MARKERS, SPECIES),
          color=factor_cmap('species', 'Category10_3', SPECIES))

p.legend.location = "top_left"
p.xaxis.axis_label = 'Petal Length'
p.yaxis.axis_label = 'Petal Width'

output_file("marker_map.html")

show(p)
