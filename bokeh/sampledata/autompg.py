"""

"""
from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'autompg sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

autompg = pd.read_csv(join(dirname(__file__), 'auto-mpg.csv'))

autompg_clean = autompg.copy()

autompg_clean['mfr'] = [x.split()[0] for x in autompg_clean.name]
autompg_clean.loc[autompg_clean.mfr=='chevy', 'mfr'] = 'chevrolet'
autompg_clean.loc[autompg_clean.mfr=='chevroelt', 'mfr'] = 'chevrolet'
autompg_clean.loc[autompg_clean.mfr=='maxda', 'mfr'] = 'mazda'
autompg_clean.loc[autompg_clean.mfr=='mercedes-benz', 'mfr'] = 'mercedes'
autompg_clean.loc[autompg_clean.mfr=='toyouta', 'mfr'] = 'toyota'
autompg_clean.loc[autompg_clean.mfr=='vokswagen', 'mfr'] = 'volkswagen'
autompg_clean.loc[autompg_clean.mfr=='vw', 'mfr'] = 'volkswagen'

ORIGINS = ['North America', 'Europe', 'Asia']

autompg_clean.origin = [ORIGINS[x-1] for x in autompg_clean.origin]
