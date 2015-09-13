"""Provides convenient access to data viz challenge data.

Source: https://github.com/localytics/data-viz-challenge

This dataset is excellent for testing and demonstrating data
viz capabilities because it contains numerous categorical
columns, with both high and low cardinality, columns with NaN
values, dates and locations. This is a very good example of
the kind of data that you might see from an information system,
where the analyst might be simply helping visualize the data
(business intelligence), or trying to understand how to exploit
the data for better system performance.

This script will download the json data, only the first time imported
from, then will load the data and clean it up in a pandas
DataFrame.

"""

from __future__ import absolute_import
from os.path import isfile
from six.moves.urllib.request import URLopener
from bokeh.charts.utils import df_from_json

try:
    import pandas as pd
except ImportError as e:
    raise RuntimeError("mtb data requires pandas (http://pandas.pydata.org) to be installed")


DATA_URL = "https://raw.githubusercontent.com/localytics/data-viz-challenge/master/data.json"


def download_project_funding():
    if not isfile('./project_funding.json'):
        print('Downloading project funding source data.')
        json_data = URLopener()
        json_data.retrieve(DATA_URL, "./project_funding.json")
        print('Download complete!')


def load_project_funding():
    project_funding = df_from_json('./project_funding.json')

    # cleanup column names
    cols = project_funding.columns
    flat_cols = [col.split('.')[1] if '.' in col else col for col in cols]
    project_funding.columns = flat_cols

    # convert to dates
    project_funding['client_time'] = pd.to_datetime(project_funding['client_time'], unit='s')
    return project_funding


download_project_funding()
project_funding = load_project_funding()
