from bokeh.sampledata.iris import flowers

# we fill a df with the data of interest and create a groupby pandas object
df = flowers[["petal_length", "petal_width", "species"]]
g = df.groupby("species")

# here we only drop that groupby object into our Scatter chart
from bokeh.charts import Scatter
scatter = Scatter(g, filename="iris_scatter.html")
scatter.title("iris dataset, gp_by_input").legend("top_left").width(600).height(400).show()
