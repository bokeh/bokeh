from bokeh.models import Jitter
from bokeh.layouts import column
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.autompg import autompg as df


colors = ["red", "olive", "darkred", "goldenrod", "skyblue", "orange", "salmon"]

p1 = figure(plot_width=600, plot_height=300, title="Years vs mpg without jittering")
p2 = figure(plot_width=600, plot_height=300, title="Years vs mpg with jittering")

for i, year in enumerate(list(df.yr.unique())):
    y = df[df['yr'] == year]['mpg']
    color = colors[i % len(colors)]

    p1.circle(x=year, y=y, color=color)
    p2.circle(x={'value': year, 'transform': Jitter(width=1)}, y=y, color=color)

output_file("jitter.html")

show(column(p1, p2))
