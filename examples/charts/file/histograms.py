
from bokeh.charts import Histogram
from bokeh.sampledata.autompg import autompg as df
from bokeh.charts import defaults, vplot, hplot, show, output_file

defaults.width = 450
defaults.height = 350

# input options
hist = Histogram(df['mpg'], title="df['mpg']")
hist2 = Histogram(df, 'displ', title="df, 'displ'")
hist3 = Histogram(df, values='hp', title="df, values='hp'")

output_file("histograms.html")

show(
    vplot(
        hplot(hist, hist2, hist3)
    )
)
