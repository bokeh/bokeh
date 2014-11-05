import numpy as np

# we build some distributions and load them into a dict
mu, sigma = 0, 0.5
normal = np.random.normal(mu, sigma, 1000)
lognormal = np.random.lognormal(mu, sigma, 1000)
distributions = dict(normal=normal, lognormal=lognormal)

# then we create a pandas df from the dict
import pandas as pd
df = pd.DataFrame(distributions)
dfd = df.to_dict()
dfl = dfd.values()
dfa = np.array(dfl)

# and finally we drop the df into out Histogram chart
from bokeh.charts import Histogram
#hist = Histogram(df, bins=50, filename="histograms.html")
#hist = Histogram(dfd, bins=50, filename="histograms.html")
#hist = Histogram(dfl, bins=50, filename="histograms.html")
hist = Histogram(dfa, bins=50, filename="histograms.html")
hist.title("Histograms").ylabel("frequency").legend(True).width(400).height(350).show()
