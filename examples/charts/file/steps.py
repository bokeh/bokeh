""" This example uses the U.S. postage rate per ounce for stamps and
postcards.

Source: https://en.wikipedia.org/wiki/History_of_United_States_postage_rates
"""

from bokeh.charts import Step, show, output_file

# build a dataset where multiple columns measure the same thing
data = dict(stamp=[
                .33, .33, .34, .37, .37, .37, .37, .39, .41, .42,
                .44, .44, .44, .45, .46, .49, .49],
            postcard=[
                .20, .20, .21, .23, .23, .23, .23, .24, .26, .27,
                .28, .28, .29, .32, .33, .34, .35],
            )

# create a line chart where each column of measures receives a unique color and dash style
line = Step(data, y=['stamp', 'postcard'],
            dash=['stamp', 'postcard'],
            color=['stamp', 'postcard'],
            title="U.S. Postage Rates (1999-2015)", ylabel='Rate per ounce', legend=True)

output_file("steps.html", title="steps.py example")

show(line)
