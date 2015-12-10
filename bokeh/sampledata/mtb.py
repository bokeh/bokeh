'''

'''
from __future__ import absolute_import

from bokeh.util.dependencies import required
pd = required('pandas',
              'mtb sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

obiszow_mtb_xcm = pd.read_csv(join(dirname(__file__), 'obiszow_mtb_xcm.csv'))
