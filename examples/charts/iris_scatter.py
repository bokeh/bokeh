from bokeh.sampledata.iris import flowers
import numpy as np

# we fill a df with the data of interest and create a groupby pandas object
df = flowers[["petal_length", "petal_width", "species"]]
g = df.groupby("species")

# here we only drop that groupby object into our Scatter chart
from bokeh.charts import Scatter, DataObject

from collections import OrderedDict
pdict = OrderedDict()

for i in g.groups.keys():
    labels = g.get_group(i).columns
    xname = labels[0]
    yname = labels[1]
    x = getattr(g.get_group(i), xname)
    y = getattr(g.get_group(i), yname)
    pdict[i] = np.array([x.values, y.values]).T

gf = DataObject(pdict, force_alias=False)

#import pdb
#pdb.set_trace()
#scatter = Scatter(g, filename="iris_scatter.html")
scatter = Scatter(gf, filename="iris_scatter.html")

scatter.title("iris dataset, gp_by_input").legend("top_left").width(600).height(400).show()
