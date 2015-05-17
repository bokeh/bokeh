
from collections import OrderedDict

import pandas as pd

from bokeh.charts import Scatter, output_file, show, vplot
from bokeh.sampledata.iris import flowers

setosa = flowers[(flowers.species == "setosa")][["petal_length", "petal_width"]]
versicolor = flowers[(flowers.species == "versicolor")][["petal_length", "petal_width"]]
virginica = flowers[(flowers.species == "virginica")][["petal_length", "petal_width"]]

xyvalues = OrderedDict([("setosa", setosa.values), ("versicolor", versicolor.values), ("virginica", virginica.values)])

scatter1 = Scatter(xyvalues, title="iris dataset, dict_input", xlabel="petal_length",
                  ylabel="petal_width", legend='top_left', marker="triangle")


groupped_df = flowers[["petal_length", "petal_width", "species"]].groupby("species")
scatter2 = Scatter(groupped_df, title="iris dataset, dict_input", xlabel="petal_length",
                  ylabel="petal_width", legend='top_left')

pdict = OrderedDict()
for i in groupped_df.groups.keys():
    labels = groupped_df.get_group(i).columns
    xname = labels[0]
    yname = labels[1]
    x = getattr(groupped_df.get_group(i), xname)
    y = getattr(groupped_df.get_group(i), yname)
    pdict[i] = list(zip(x, y))

df = pd.DataFrame(pdict)
scatter3 = Scatter(
    df, title="iris dataset, dict_input",
    xlabel="petal_length", ylabel="petal_width", legend='top_left')

scatter4 = Scatter(
    list(xyvalues.values()), title="iris dataset, dict_input",
    xlabel="petal_length", ylabel="petal_width", legend='top_left')

output_file("scatter.html")

show(vplot(scatter1, scatter2, scatter3, scatter4))
