"""

"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'autompg2 sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

autompg2 = pd.read_csv(join(dirname(__file__), 'auto-mpg2.csv'))

def capitalize_words(string):
    return " ".join([ word.capitalize() for word in string.split(" ") ])

autompg2["manufacturer"] = autompg2["manufacturer"].map(capitalize_words)
autompg2["model"] = autompg2["model"].map(capitalize_words)
autompg2["drv"] = autompg2["drv"].replace({"f": "front", "r": "rear", "4": "4x4"})
