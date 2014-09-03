from bokeh.sampledata.unemployment1948 import data

# pandas magic
df = data[data.columns[:-2]]
df2 = df.set_index(df[df.columns[0]].astype(str))
df2.drop(df.columns[0], axis=1, inplace=True)
df3 = df2.transpose()

# bokeh magic
from bokeh.charts import HeatMap
hm = HeatMap(df3, title="heatmap, pd_input", filename="heatmap.html")
hm.width(1000).height(400).show()