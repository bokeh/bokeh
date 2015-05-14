from collections import OrderedDict

from bokeh.charts import Scatter, output_file, show
from bokeh.sampledata.iris import flowers

# fill a data frame with the data of interest and create a groupby object
df = flowers[["petal_length", "petal_width", "species"]]
xyvalues = g = df.groupby("species")

# drop that groupby object into a dict
pdict = OrderedDict()

for i in g.groups.keys():
    labels = g.get_group(i).columns
    xname = labels[0]
    yname = labels[1]
    x = getattr(g.get_group(i), xname)
    y = getattr(g.get_group(i), yname)
    pdict[i] = zip(x, y)

# any of the following commented are also valid Scatter inputs
#xyvalues = pdict
#xyvalues = pd.DataFrame(xyvalues)
#xyvalues = xyvalues.values()
#xyvalues = np.array(xyvalues.values())

output_file("iris_scatter.html")

TOOLS="resize,crosshair,pan,wheel_zoom,box_zoom,reset,previewsave"

scatter = Scatter(xyvalues, tools=TOOLS, ylabel='petal_width')

show(scatter)
