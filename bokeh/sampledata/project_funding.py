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

from collections import defaultdict
import json
import os

from pandas.io.json import json_normalize
from six import iteritems
from six.moves.urllib.request import URLopener

def denormalize_column_names(parsed_data):
    """Attempts to remove the column hierarchy if possible when parsing from json.

    Args:
        parsed_data (:class:`pandas.DataFrame`): df parsed from json data using
            :func:`pandas.io.json.json_normalize`.

    Returns:
        dataframe with updated column names
    """
    cols = parsed_data.columns.tolist()
    base_columns = defaultdict(list)
    for col in cols:
        if '.' in col:
            # get last split of '.' to get primary column name
            base_columns[col].append(col.split('.')[-1])

    rename = {}
    # only rename columns if they don't overlap another base column name
    for col, new_cols in iteritems(base_columns):
        if len(new_cols) == 1:
            rename[col] = new_cols[0]

    if len(list(rename.keys())) > 0:
        return parsed_data.rename(columns=rename)
    else:
        return parsed_data

def df_from_json(data, rename=True, **kwargs):
    """Attempt to produce :class:`pandas.DataFrame` from hierarchical json-like data.

    This utility wraps the :func:`pandas.io.json.json_normalize` function and by
    default will try to rename the columns produced by it.

    Args:
        data (str or list(dict) or dict(list(dict))): a path to json data or loaded json
            data. This function will look into the data and try to parse it correctly
            based on common structures of json data.
        rename (bool, optional: try to rename column hierarchy to the base name. So
            medals.bronze would end up being bronze. This will only rename to the base
            column name if the name is unique, and only if the pandas json parser
            produced columns that have a '.' in the column name.
        **kwargs: any kwarg supported by :func:`pandas.io.json.json_normalize`

    Returns:
        a parsed pandas dataframe from the json data, unless the path does not exist,
            the input data is nether a list or dict. In that case, it will return `None`.
    """
    parsed = None
    if isinstance(data, str):
        with open(data) as data_file:
            data = json.load(data_file)

    if isinstance(data, list):
        parsed = json_normalize(data)

    elif isinstance(data, dict):
        for k, v in iteritems(data):
            if isinstance(v, list):
                parsed = json_normalize(v)

    # try to rename the columns if configured to
    if rename and parsed is not None:
        parsed = denormalize_column_names(parsed)

    return parsed

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
