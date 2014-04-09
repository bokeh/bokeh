import json
import tempfile
import time
import datetime as dt
from os.path import dirname, join

import requests
from six.moves.urllib.parse import urlencode
from unittest import skip

from . import test_utils
from ...serverconfig import Server
from ...tests.test_utils import skipIfPyPy

datadir = join(dirname(dirname(dirname(dirname(__file__)))), 'remotedata')


class RemoteDataTestCase(test_utils.BokehServerTestCase):
    options = {'data_directory': datadir}

    @skip
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_list(self):
        config = tempfile.mkdtemp()
        s = Server(configdir=config)
        sources = s.list_data()
        result = set(['/defaultuser/GOOG.hdf5',
                      '/defaultuser/FB.hdf5',
                      '/defaultuser/MSFT.hdf5',
                      '/defaultuser/AAPL.hdf5',
                      '/defaultuser/volume.table',
                      '/defaultuser/array.table'
                  ])
        assert result == set(sources)

    @skip
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_line_downsample(self):
        config = tempfile.mkdtemp()
        s = Server(configdir=config)
        url = "http://localhost:5006/bokeh/data/defaultuser/defaultuser/AAPL.hdf5"
        params = ('close', 'date', ['close', 'open', 'date'], 
                  [1000 * time.mktime(dt.datetime(2012,1,1).timetuple()),
                   1000 * time.mktime(dt.datetime(2013,1,1).timetuple())],
                  10)
        url += "?" + urlencode({'downsample_function': 'line1d',
                                'downsample_parameters': json.dumps(params)})
        result = requests.get(
            url,
            )
        result = result.json()
