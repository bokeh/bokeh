
from bokeh.charts import Histogram, defaults, vplot, hplot, show, output_file
from bokeh.sampledata.autompg import autompg as df

defaults.plot_width = 400
defaults.plot_height = 350

# input options
hist  = Histogram(df['mpg'], title="df['mpg']")
hist2 = Histogram(df, 'displ', title="df, 'displ'")
hist3 = Histogram(df, values='hp', title="df, values='hp'")

hist4 = Histogram(df, values='hp', color='cyl',
                  title="df, values='hp', color='cyl'", legend='top_right')

hist5 = Histogram(df, values='mpg', bins=50,
                  title="df, values='mpg', bins=50")

output_file("histogram_multi.html", title="histogram_multi.py example")

show(vplot(
    hplot(hist, hist2),
    hplot(hist3, hist4),
    hplot(hist5)
))
