import pandas
import bokeh

from bokeh.chaco_gg.functional import *

df = pandas.read_csv("../auto-mpg.csv")

ggplot(df, aes("displ", "mpg")) + geom_point()


