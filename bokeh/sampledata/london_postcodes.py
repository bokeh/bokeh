'''
This modules exposes geometry data for London Postcodes. It exposes a dictionary 'data' which is
indexed by the two-tuple containing (parent_area_id, area_id) and has the following dictionary as the
associated value:
    data[(1,1)]['name']
    data[(1,1)]['lats']
    data[(1,1)]['lons']

Data is powered by MapIt
'''
from __future__ import absolute_import
from os.path import dirname, join
import csv


data = {}

with open(join(dirname(__file__),'london_postcodes.csv')) as f:
    reader = csv.DictReader(f)
    for row in reader:
        parent_id = row['parent_id']
        area_id = row['area_id']
        lats = row['lats']
        lons = row['lons']
        name = row['name']
        data[(int(parent_id), int(area_id))] = {'name': name, 'lats': lats, 'lons': lons, }