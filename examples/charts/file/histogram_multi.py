from bokeh.charts import Histogram, defaults, show, output_file
from bokeh.layouts import gridplot
from bokeh.sampledata.autompg import autompg as df

defaults.plot_width = 400
defaults.plot_height = 350

# input options
hist  = Histogram(df['mpg'], title="df['mpg']")
hist2 = Histogram(df, 'displ', title="df, 'displ'")
hist3 = Histogram(df, values='hp', title="df, values='hp'", density=True)

hist4 = Histogram(df, values='hp', color='cyl',
                  title="df, values='hp', color='cyl'", legend='top_right')

hist5 = Histogram(df, values='mpg', bins=50,
                  title="df, values='mpg', bins=50")
hist6 = Histogram(df, values='mpg', bins=[10, 15, 25, 100], tooltips=[('Bin', "@label")],
                  title="df, values='mpg', bins=[10, 15, 25, 100]")

output_file("histogram_multi.html", title="histogram_multi.py example")

show(gridplot(hist,  hist2, hist3, hist4,
              hist5, hist6, ncols=2))
