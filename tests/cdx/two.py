import pandas
import bokeh

from bokeh.functional import *

df = pandas.read_csv("../auto-mpg.csv")

s = ggplot(df, aes("displ", "mpg", color="red")) + geom_point()

u = ggplot(df, aes("hp", "weight")) + \
        aes(color="green") + \
        geom_point()

with open("two.1.html", "w") as f:
    f.write(s.to_html())
with open("two.2.html", "w") as f:
    f.write(u.to_html())

