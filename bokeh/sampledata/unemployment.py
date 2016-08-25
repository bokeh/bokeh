'''
This modules exposes per-county unemployment data for Unites States in 2009. It exposes a
dictionary 'data' which is indexed by the two-tuple containing (state_id, county_id) and has the
unemployment rate (2009) as the associated value.

'''
from __future__ import absolute_import

import csv
import sys
from os.path import join
from . import _data_dir

data_dir = _data_dir()

data = {}

# csv differs in Python 2.x and Python 3.x. Open the file differently in each.
filename = join(data_dir, 'unemployment09.csv')
if sys.version_info[0] < 3:
    f = open(filename, 'rb')
else:
    f = open(filename, 'r', newline='', encoding='utf8')

with f:
    reader = csv.reader(f, delimiter=',', quotechar='"')
    for row in reader:
        dummy, state_id, county_id, dumm, dummy, dummy, dummy, dummy, rate = row
        data[(int(state_id), int(county_id))] = float(rate)
