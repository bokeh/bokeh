
from os.path import dirname, join

try:
    import pandas as pd
except ImportError as e:
    pd = None

if pd:
    iris = pd.read_csv(join(dirname(__file__), 'iris.csv'))

