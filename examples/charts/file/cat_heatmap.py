from bokeh.charts import HeatMap, output_file, show
from bokeh.sampledata.unemployment1948 import data

# pandas magic
df = data[data.columns[:-2]]
df2 = df.set_index(df[df.columns[0]].astype(str))
df2.drop(df.columns[0], axis=1, inplace=True)
df3 = df2.transpose()

output_file("cat_heatmap.html")

hm = HeatMap(df3, title="categorical heatmap", width=800)

show(hm)