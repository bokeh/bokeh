'''
This modules exposes per-county unemployment data for Unites States in 2009. It exposes a
dictionary 'data' which is indexed by the two-tuple containing (state_id, county_id) and has the
unemployment rate (2009) as the associated value.

'''
from __future__ import absolute_import

import csv
from os.path import join
from . import _data_dir
from . import _open_csv_file

data_dir = _data_dir()

data = {}
with _open_csv_file(join(data_dir, 'unemployment09.csv')) as f:
    reader = csv.reader(f, delimiter=',', quotechar='"')
    for row in reader:
        dummy, state_id, county_id, dumm, dummy, dummy, dummy, dummy, rate = row
        data[(int(state_id), int(county_id))] = float(rate)
