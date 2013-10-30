import pandas
import bokeh

from bokeh.chaco_gg.functional import *
df = pandas.read_csv("../auto-mpg.csv")

s = ggplot(df, aes("displ", "mpg", color="red")) + geom_point()
s += tool_pan("right")
s += tool_zoom()
s += tool_regression()

u = ggplot(df, aes("hp", "weight")) + aes(color="green") + geom_point()
u += tool_pan()
u += tool_zoom()


