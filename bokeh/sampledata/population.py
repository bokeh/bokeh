'''

'''
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'population sample data requires Pandas (http://pandas.pydata.org) to be installed')

from . import _data_dir

def load_population():
    csv_file = _data_dir("WPP2012_SA_DB03_POPULATION_QUINQUENNIAL.csv")
    df = pd.read_csv(csv_file, encoding="CP1250")
    df = df[df.Sex != "Both"]
    df = df.drop(["VarID", "Variant", "MidPeriod", "SexID", "AgeGrpSpan"], axis=1)
    df = df.rename(columns={"Time": "Year"})
    df.Value *= 1000
    return df
