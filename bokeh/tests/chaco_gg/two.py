import pandas
import bokeh

from bokeh.chaco_gg.functional import *

df = pandas.read_csv("../auto-mpg.csv")

s = ggplot(df, aes("displ", "mpg", color="red")) + geom_point()

u = ggplot(df, aes("hp", "weight")) + \
        aes(color="green") + \
        geom_point()


