from collections import OrderedDict

import numpy as np
import pandas as pd

from bokeh.charts import Bar
from bokeh.plotting import output_file, show, VBox
from bokeh.sampledata.olympics2014 import data as original_data

data = {d['abbr']: d['medals'] for d in original_data['data'] if d['medals']['total'] > 0}

countries = sorted(data.keys(), key=lambda x: data[x]['total'], reverse=True)

gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

medals = OrderedDict(bronze=bronze, silver=silver, gold=gold)

bar1 = Bar(medals, countries, title="grouped, dict_input", xlabel="countries", ylabel="medals",
          legend=True, width=800, height=600)

bar2 = Bar(medals, countries, title="stacked, dict_input", xlabel="countries", ylabel="medals",
          legend=True, width=800, height=600, stacked=True)

df = pd.DataFrame(medals, index=countries)
bar3 = Bar(df, title="stacked, df_input", xlabel="countries", ylabel="medals", legend=True, width=800, height=600, stacked=True)

medals = np.array([bronze, silver, gold])
bar4 = Bar(df, title="grouped, df_input", xlabel="countries", ylabel="medals", legend=True, width=800, height=600)

output_file("bar.html")

show(VBox(bar1, bar2, bar3, bar4))