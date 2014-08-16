import numpy as np
from bokeh.sampledata.olympics2014 import data

# we get data data
data = {d['abbr']: d['medals'] for d in data['data'] if d['medals']['total'] > 0}

# then, we grouped them properly
countries = sorted(data.keys(), key=lambda x: data[x]['total'], reverse=True)
gold = np.array([data[abbr]['gold'] for abbr in countries], dtype=np.float)
silver = np.array([data[abbr]['silver'] for abbr in countries], dtype=np.float)
bronze = np.array([data[abbr]['bronze'] for abbr in countries], dtype=np.float)

# later, we build a dict containing the grouped data
medals = dict(bronze=bronze, silver=silver, gold=gold)

# and finally we drop the dict into our BoxPlot chart
from bokeh.charts import BoxPlot
boxplot = BoxPlot(medals, marker='circle', outliers=True, title="boxplot test", xlabel="medal type", ylabel="medal count", 
             width=600, height=400, filename="boxplot")
boxplot.show()