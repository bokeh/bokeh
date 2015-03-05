'''
This module provides the medal counts by country for the 2014 olympics.

'''
from __future__ import absolute_import

import json
from os.path import dirname, join

data = json.load(open(join(dirname(__file__), 'olympics2014.json')))
