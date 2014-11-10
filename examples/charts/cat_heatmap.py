from bokeh.sampledata.unemployment1948 import data
from collections import OrderedDict
# pandas magic
df = data[data.columns[:-2]]
df2 = df.set_index(df[df.columns[0]].astype(str))
df2.drop(df.columns[0], axis=1, inplace=True)
df3 = df2.transpose()

# bokeh magic
from bokeh.charts import CategoricalHeatMap, NewCategoricalHeatMap, DataAdapter

cols = df3.columns.tolist()
index = df3.index.tolist()

#df31 = DataAdapter(df3.to_dict(), index=index, columns=cols)
#df32 = DataAdapter(df3, index=index, columns=cols)
#df33 = DataAdapter(df3.values.T, index=index, columns=cols)
#df34 = DataAdapter(list(df3.values.T), index=index, columns=cols)
#df35 = DataAdapter(df3.to_dict())
#df36 = DataAdapter(df3)
#df37 = DataAdapter(df3.values.T)
#df38 = DataAdapter(list(df3.values.T))

df15 = df3.to_dict()
df15 = OrderedDict(
    sorted(
        [
            (
                k,
                OrderedDict([(kk, v[kk]) for kk in index])
            ) for k, v in df15.items()
        ]
    )
)
df16 = df3
df17 = df3.values.T
df18 = list(df3.values.T)

#hm = CategoricalHeatMap(df3, title="categorical heatmap, pd_input", filename="cat_heatmap.html")
hm = NewCategoricalHeatMap(df18, title="categorical heatmap, pd_input", filename="cat_heatmap.html")
hm.width(1000).height(400).show()