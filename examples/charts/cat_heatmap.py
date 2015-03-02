from collections import OrderedDict

from bokeh.sampledata.unemployment1948 import data
from bokeh.charts import HeatMap
from bokeh.plotting import output_file, show
# pandas magic
df = data[data.columns[:-2]]
df2 = df.set_index(df[df.columns[0]].astype(str))
df2.drop(df.columns[0], axis=1, inplace=True)
df3 = df2.transpose()

cols = df3.columns.tolist()
index = df3.index.tolist()

#prepare some inputs
to_odict = lambda v: OrderedDict((kk, v[kk]) for kk in index)

# Create an ordered dict (or ordered dicts) with the data from the DataFrame
datadict = df3.to_dict()
data = OrderedDict(sorted((k, to_odict(v)) for k, v in datadict.items()))

# any of the following commented line is a valid HeatMap input
#data = df3
#data = df3.values.T
#data = list(df3.values.T)
output_file("cat_heatmap.html")
hm = HeatMap(data, title="categorical heatmap", width=800,filename="cat_heatmap.html")
show(hm) # or hm.show()