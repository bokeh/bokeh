import numpy as np
from collections import OrderedDict

# we build some distributions and load them into a dict
mu, sigma = 0, 0.5
normal = np.random.normal(mu, sigma, 1000)
lognormal = np.random.lognormal(mu, sigma, 1000)
dfd = distributions = OrderedDict(normal=normal, lognormal=lognormal)

# then we create a pandas df from the dict
import pandas as pd
df = pd.DataFrame(distributions)

dfd = df.to_dict()

for k, v in dfd.items():
    dfd[k] = v.values()

dfl = dfd.values()
dft = tuple(dfl)
dftt = tuple([tuple(x) for x in dfl])
dfa = np.array(dfl)
dfscalar = dfd.values()[0]


## and finally we drop the df into out Histogram chart
from bokeh.charts import Histogram, NewHistogram, DataAdapter
#hist = Histogram(DataAdapter(df, force_alias=False), bins=50, filename="histograms.html")
#hist = Histogram(DataAdapter(dfd, force_alias=False), bins=50, filename="histograms.html")
#hist = Histogram(DataAdapter(dfl, force_alias=False), bins=50, filename="histograms.html")
#hist = Histogram(DataAdapter(dfa, force_alias=False), bins=50, filename="histograms.html")
hist = NewHistogram(df, bins=50, filename="histograms.html", facet=True)
hist.title("Histograms").ylabel("frequency").legend(True).width(400).height(350).show()