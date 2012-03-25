import pandas
import bokeh

from bokeh.functional import *

df = pandas.read_csv("auto-mpg.csv")

ggplot(df, aes("displ", "mpg")) + geom_point()


