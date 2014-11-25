from bokeh.sampledata.unemployment1948 import data
from collections import OrderedDict

# pandas magic
df = data[data.columns[:-2]]
df2 = df.set_index(df[df.columns[0]].astype(str))
df2.drop(df.columns[0], axis=1, inplace=True)
df3 = df2.transpose()

# bokeh magic
from bokeh.charts import HeatMap

cols = df3.columns.tolist()
index = df3.index.tolist()

#prepare some inpus
df = df3.to_dict()
df = OrderedDict(
    sorted(
        [(k, OrderedDict([(kk, v[kk]) for kk in index]) ) for k, v in df.items()]
    )
)

# any of the following commented are valid Bar inputs
#df = df3
#df = df3.values.T
#df = list(df3.values.T)

hm = HeatMap(df, title="categorical heatmap, pd_input", filename="heatmap.html")
hm.width(1000).height(400).show()