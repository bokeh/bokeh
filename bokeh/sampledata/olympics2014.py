'''
This module provides the medal counts by country for the 2014 olympics. 

'''
import json
from os.path import dirname, join

data = json.load(open(join(dirname(__file__), 'olympics2014.json')))

