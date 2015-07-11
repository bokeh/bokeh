from bokeh.charts import Scatter, output_file, show

# prepare some data, a Pandas GroupBy object in this case
from bokeh.sampledata.iris import flowers
grouped = flowers[["petal_length", "petal_width", "species"]].groupby("species")

# create a scatter chart
p = Scatter(grouped, title="iris data", width=400, height=400,
            xlabel="petal length", ylabel="petal width", legend='top_left')

# specify how to output the plot(s)
output_file("foo.html")

# display the figure
show(p)
