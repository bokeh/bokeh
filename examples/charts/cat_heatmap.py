from bokeh.sampledata.unemployment1948 import data

# pandas magic
df = data[data.columns[:-2]]
df2 = df.set_index(df[df.columns[0]].astype(str))
df2.drop(df.columns[0], axis=1, inplace=True)
df3 = df2.transpose()

# bokeh magic
from bokeh.charts import CategoricalHeatMap, DataObject

cols = df3.columns.tolist()
index = df3.index.tolist()

df31 = DataObject(df3.to_dict(), index=index, columns=cols)
df32 = DataObject(df3, index=index, columns=cols)
df33 = DataObject(df3.values.T, index=index, columns=cols)
df34 = DataObject(list(df3.values.T), index=index, columns=cols)
df35 = DataObject(df3.to_dict())
df36 = DataObject(df3)
df37 = DataObject(df3.values.T)
df38 = DataObject(list(df3.values.T))

hm = CategoricalHeatMap(df32, title="categorical heatmap, pd_input", filename="cat_heatmap.html")
hm.width(1000).height(400).show()