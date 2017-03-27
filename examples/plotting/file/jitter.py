from bokeh.models import Jitter
from bokeh.layouts import column
from bokeh.plotting import figure, show, output_file
from bokeh.sampledata.autompg import autompg as df

p1 = figure(plot_width=600, plot_height=300, title="Years vs mpg without jittering")
p1.circle(x=df['yr'], y=df['mpg'], color='darkred')

p2 = figure(plot_width=600, plot_height=300, title="Years vs mpg with jittering")
for year in df['yr'].unique():
    p2.circle(x={'value': year, 'transform': Jitter(width=1)},
              y=df[df['yr'] == year]['mpg'],
              color='salmon')

output_file("jitter.html")

show(column(p1, p2))
