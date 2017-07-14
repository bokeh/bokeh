""" Daylight hours from http://www.sunrisesunset.com

"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'daylight sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import join, abspath, dirname

def load_daylight_hours(file):
    path = join(dirname(abspath(__file__)), file)
    df = pd.read_csv(path, parse_dates=["Date", "Sunrise", "Sunset"])

    df["Date"] = df.Date.map(lambda x: x.date())
    df["Sunrise"] = df.Sunrise.map(lambda x: x.time())
    df["Sunset"] = df.Sunset.map(lambda x: x.time())

    return df

daylight_warsaw_2013 = load_daylight_hours("daylight_warsaw_2013.csv")
