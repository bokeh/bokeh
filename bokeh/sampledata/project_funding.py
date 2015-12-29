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

Resulting dataframe reports the following dtypes:
    age                       object
    amount                   float64
    category                  object
    client_time       datetime64[ns]
    device                    object
    event_name                object
    gender                    object
    city                      object
    latitude                 float64
    longitude                float64
    state                     object
    zip_code                   int64
    marital_status            object
    session_id                object
"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'project_funding sample data requires Pandas (http://pandas.pydata.org) to be installed')

import os

from six.moves.urllib.request import URLopener

from bokeh.charts.utils import df_from_json

DATA_URL = "https://raw.githubusercontent.com/localytics/data-viz-challenge/master/data.json"
DOWNLOAD_NAME = 'project_funding.json'
CSV_NAME = 'project_funding.csv'

# Get absolute path relative to script
data_dir = os.path.dirname(os.path.realpath(__file__))
json_file_path = os.path.join(data_dir, DOWNLOAD_NAME)
csv_file_path = os.path.join(data_dir, CSV_NAME)


def download_project_funding():
    if not os.path.isfile(json_file_path):
        print('Downloading project funding source data.')
        json_data = URLopener()
        json_data.retrieve(DATA_URL, json_file_path)
        print('Download complete!')


def load_project_funding():
    project_funding = df_from_json(json_file_path)

    # cleanup column names
    cols = project_funding.columns
    flat_cols = [col.split('.')[1] if '.' in col else col for col in cols]
    project_funding.columns = flat_cols

    # convert to dates
    project_funding['client_time'] = pd.to_datetime(project_funding['client_time'], unit='s')
    return project_funding


def load_cached_funding():
    if not os.path.isfile(csv_file_path):
        project_funding = load_project_funding()
        project_funding.to_csv(csv_file_path, index=False)
    else:
        project_funding = pd.read_csv(csv_file_path, parse_dates=['client_time'])

    return project_funding


download_project_funding()
project_funding = load_cached_funding()
