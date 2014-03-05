'''
This module provides the co-occurences of characters in Les Miserables as JSON data.

'''
import json
from os.path import dirname, join

data = json.load(open(join(dirname(__file__), 'les_mis.json')))

