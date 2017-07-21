"""

"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
    'sea surface temperature sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

sea_surface_temperature = pd.read_csv(join(dirname(__file__), 'sea_surface_temperature.csv.gz'),
                                      parse_dates=True, index_col=0)
sea_surface_temperature = sea_surface_temperature.rename(columns={'temperature (celsius)': 'temperature'})
sea_surface_temperature.index.name = 'time'
