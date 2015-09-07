
from bokeh.charts import Histogram
from bokeh.sampledata.autompg import autompg as df
from bokeh.charts import defaults, vplot, hplot, show, output_file

defaults.width = 450
defaults.height = 350

hist = Histogram(df, values='mpg')

output_file("histograms.html")

show(
    vplot(
        hplot(hist)
    )
)
