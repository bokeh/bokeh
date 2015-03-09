from __future__ import absolute_import

from os.path import dirname, join

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("auto-mpg2 data requires pandas (http://pandas.pydata.org) to be installed")

autompg2 = pd.read_csv(join(dirname(__file__), 'auto-mpg2.csv'))

def capitalize_words(string):
    return " ".join([ word.capitalize() for word in string.split(" ") ])

autompg2["manufacturer"] = autompg2["manufacturer"].map(capitalize_words)
autompg2["model"] = autompg2["model"].map(capitalize_words)
autompg2["drv"] = autompg2["drv"].replace({"f": "front", "r": "rear", "4": "4x4"})
