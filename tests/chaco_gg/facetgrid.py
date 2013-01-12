import pandas
import bokeh

from bokeh.chaco_gg.functional import *

df = pandas.read_csv("../auto-mpg2.csv")

auto_show(False)

ggplot(df, aes("displ", "mpg")) + facet_grid("origin", "cyl") + geom_point()

show_plot()

