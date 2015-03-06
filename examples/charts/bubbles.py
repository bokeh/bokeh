
from collections import OrderedDict

import pandas as pd

from bokeh.charts import Scatter#, Bubble
from bokeh.charts.builder.bubble_builder import Bubble
from bokeh.plotting import output_file, show, VBox
from bokeh.sampledata.iris import flowers
from bokeh.resources import CDN, INLINE
from bokeh.templates import RESOURCES
from bokeh.embed import autoload_static, components
plot_resources = RESOURCES.render(
    js_raw=CDN.js_raw,
    css_raw=CDN.css_raw,
    js_files=CDN.js_files,
    css_files=CDN.css_files,
)

setosa = flowers[(flowers.species == "setosa")][["petal_length", "petal_width"]]
versicolor = flowers[(flowers.species == "versicolor")][["petal_length", "petal_width"]]
virginica = flowers[(flowers.species == "virginica")][["petal_length", "petal_width"]]

xyvalues = OrderedDict([("setosa", setosa.values), ("versicolor", versicolor.values), ("virginica", virginica.values)])

scatter1 = Bubble(xyvalues,
                  sizes=[setosa['petal_width'], versicolor['petal_width'], virginica['petal_width']],
                  title="iris dataset, dict_input", xlabel="petal_length",
                  ylabel="petal_width", legend='top_left', marker="circle")
js, tag = autoload_static(scatter1, CDN, '/media/js/bubble_example.js')

groupped_df = flowers[["petal_length", "petal_width", "species"]].groupby("species")
scatter2 = Bubble(groupped_df,
                  sizes=[setosa['petal_length'], versicolor['petal_length'], virginica['petal_length']],
                  title="iris dataset, dict_input", xlabel="petal_length",
                  ylabel="petal_width", legend='top_left')

xyvalues = OrderedDict()
xyvalues['python'] = [(1, 2), (3, 3), (4, 7), (5, 5), (8, 26)]
xyvalues['pypy'] = [(1, 12), (3, 23), (4, 47), (5, 15), (8, 46)]
xyvalues['jython'] = [(1, 22), (3, 43), (4, 10), (6, 25), (8, 16)]

scatter3 = Bubble(xyvalues, sizes=[[3,4,3,6,7], [5,3,2,1,5], [4,2,5,8,8]],
        title="Scatter", legend="top_left", ylabel='Languages')
#
output_file("scatter.html")
#
show(scatter3)
# show(VBox([scatter1, scatter2, scatter3]))
