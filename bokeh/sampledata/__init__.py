import csv
import gzip
import numpy as np
import xml.etree.cElementTree as et
from os.path import dirname, join

try:
    import pandas as pd
except ImportError as e:
    pd = None

if pd:
    iris = pd.read_csv(join(dirname(__file__), 'iris.csv'))

states = {}
with open(join(dirname(__file__), 'US Regions State Boundaries.csv')) as f:
    f.next()
    reader = csv.reader(f, delimiter=',', quotechar='"')
    for row in reader:
        region, name, code, geometry, dummy = row
        xml = et.fromstring(geometry)
        lats = []
        lons = []
        for i, poly in enumerate(xml.findall('.//outerBoundaryIs/LinearRing/coordinates')):
            if i > 0:
                lats.append(np.nan)
                lons.append(np.nan)
            coords = (c.split(',')[:2] for c in poly.text.split())
            lat, lon = zip(*[(float(lat), float(lon)) for lon, lat in coords])
            lats.extend(lat)
            lons.extend(lon)
            states[code] = {
                'name'   : name,
                'region' : region,
                'lats'   : np.array(lats),
                'lons'   : np.array(lons),
            }

counties = {}
with gzip.open(join(dirname(__file__), 'United States Counties.csv.gz')) as f:
    f.next()
    reader = csv.reader(f, delimiter=',', quotechar='"')
    for row in reader:
        dummy, code, dummy, dummy, geometry, dummy, dummy, dummy, dummy, state_id, county_id, dummy, dummy = row
        xml = et.fromstring(geometry)
        lats = []
        lons = []
        for i, poly in enumerate(xml.findall('.//outerBoundaryIs/LinearRing/coordinates')):
            if i > 0:
                lats.append(np.nan)
                lons.append(np.nan)
            coords = (c.split(',')[:2] for c in poly.text.split())
            lat, lon = zip(*[(float(lat), float(lon)) for lon, lat in coords])
            lats.extend(lat)
            lons.extend(lon)
            counties[(int(state_id), int(county_id))] = {
                'lats'   : np.array(lats),
                'lons'   : np.array(lons),
            }

unemployment = {}
with open(join(dirname(__file__), 'unemployment09.csv')) as f:
    reader = csv.reader(f, delimiter=',', quotechar='"')
    for row in reader:
        dummy, state_id, county_id, dumm, dummy, dummy, dummy, dummy, rate = row
        unemployment[(int(state_id), int(county_id))] = float(rate)


