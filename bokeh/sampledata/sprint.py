from __future__ import absolute_import

from bokeh.util.dependencies import import_required
pd = import_required('pandas',
              'sprint sample data requires Pandas (http://pandas.pydata.org) to be installed')

from os.path import dirname, join

sprint = pd.read_csv(join(dirname(__file__), 'sprint.csv'), skipinitialspace=True, escapechar="\\")
