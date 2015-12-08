'''
This module returns geojson of the UK NHS' England area teams.
The data was downloaded from https://github.com/JeniT/nhs-choices on November 14th, 2015.
It is a geojson representation of open data available from NHS Choices. It was downloaded
for demonstration purposes only, it is not kept up to date.
'''

from __future__ import absolute_import

from os.path import dirname, join

filename = join(dirname(__file__), 'sample_geojson.geojson')
with open(filename, 'r') as f:
        geojson = f.read()
