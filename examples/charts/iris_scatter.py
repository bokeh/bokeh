from bokeh.sampledata.iris import flowers
import numpy as np
import pandas as pd

# we fill a df with the data of interest and create a groupby pandas object
df = flowers[["petal_length", "petal_width", "species"]]
g = df.groupby("species")

# here we only drop that groupby object into our Scatter chart
from bokeh.charts import Scatter

from collections import OrderedDict
pdict = OrderedDict()

for i in g.groups.keys():
    labels = g.get_group(i).columns
    xname = labels[0]
    yname = labels[1]
    x = getattr(g.get_group(i), xname)
    y = getattr(g.get_group(i), yname)
    pdict[i] = zip(x, y)
    #pdict[i] = np.array([x.values, y.values]).T

xyvalues = pdict

#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = xyvalues.values()
#xyvalues = np.array(xyvalues.values())

scatter = Scatter(g, filename="iris_scatter.html")
#scatter = Scatter(xyvalues, filename="iris_scatter.html", ylabel='petal_width',  facet=False)

scatter.title("iris dataset, gp_by_input").legend("top_left").width(600).height(400).show()
