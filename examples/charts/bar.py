from collections import OrderedDict

import numpy as np
import pandas as pd

from bokeh.charts import Bar, output_file, show, vplot, hplot
from bokeh.models import Range1d
from bokeh.sampledata.olympics2014 import data as original_data

width = 700
height = 500
legend_position = "top_right"

data = {d['abbr']: d['medals'] for d in original_data['data'] if d['medals']['total'] > 0}

countries = sorted(data.keys(), key=lambda x: data[x]['total'], reverse=True)

gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

# dict input
medals = OrderedDict(bronze=bronze, silver=silver, gold=gold)

dict_stacked = Bar(
    medals, countries, title="OrderedDict input | Stacked", legend=legend_position,
    xlabel="countries", ylabel="medals", width=width, height=height,
    stacked=True
)

# data frame input
df = pd.DataFrame(medals, index=countries)

df_grouped = Bar(
    df, title="Data Frame input | Grouped", legend=legend_position,
    xlabel="countries", ylabel="medals", width=width, height=height
)

# Numpy array input with different data to affect the ranges
random = np.random.rand(3, 8)
mixed = random - np.random.rand(3, 8)
categories = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

np_stacked = Bar(
    random, cat=categories, title="Numpy Array input | Stacked",
    ylabel="Random Number", xlabel="", width=width, height=height,
    stacked=True
)

np_negative_grouped = Bar(
    random * -1, cat=categories, title="All negative input | Grouped",
    ylabel="Random Number", width=width, height=height
)

np_custom = Bar(
    mixed, cat=categories, title="Custom range (start=-3, end=0.4)",
    ylabel="Random Number", width=width, height=height,
    continuous_range=Range1d(start=-3, end=0.4)
)

np_mixed_grouped = Bar(
    mixed, cat=categories, title="Mixed-sign input | Grouped",
    ylabel="Random Number", width=width, height=height
)

# collect and display
output_file("bar.html")

show(vplot(
    hplot(dict_stacked, df_grouped),
    hplot(np_stacked, np_negative_grouped),
    hplot(np_mixed_grouped, np_custom),
))
