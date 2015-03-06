
from collections import OrderedDict

import pandas as pd

from bokeh.charts import Bubble
from bokeh.plotting import output_file, show, VBox
from bokeh.sampledata.iris import flowers

setosa = flowers[(flowers.species == "setosa")][["petal_length", "petal_width"]]
versicolor = flowers[(flowers.species == "versicolor")][["petal_length", "petal_width"]]
virginica = flowers[(flowers.species == "virginica")][["petal_length", "petal_width"]]

xyvalues = OrderedDict([("setosa", setosa.values), ("versicolor", versicolor.values), ("virginica", virginica.values)])

bubbles1 = Bubble(xyvalues,
                  sizes=[setosa['petal_width'], versicolor['petal_width'], virginica['petal_width']],
                  title="iris dataset, dict_input", xlabel="petal_length",
                  ylabel="petal_width", legend='top_left', marker="circle")
groupped_df = flowers[["petal_length", "petal_width", "species"]].groupby("species")
bubbles2 = Bubble(groupped_df,
                  sizes=[setosa['petal_length'], versicolor['petal_length'], virginica['petal_length']],
                  title="iris dataset, dict_input", xlabel="petal_length",
                  ylabel="petal_width", legend='top_left')

xyvalues = OrderedDict()
xyvalues['python'] = [(1, 2), (3, 3), (4, 7), (5, 5), (8, 26)]
xyvalues['pypy'] = [(1, 12), (3, 23), (4, 47), (5, 15), (8, 46)]
xyvalues['jython'] = [(1, 22), (3, 43), (4, 10), (6, 25), (8, 16)]

bubbles3 = Bubble(
    xyvalues, sizes=[[3,4,3,6,7], [5,3,2,1,5], [4,2,5,8,8]],
    title="Scatter", legend="top_left", ylabel='Languages',
    marker='square', max_bubble_size=100.)

output_file("scatter.html")
show(VBox([bubbles1, bubbles2, bubbles3]))
