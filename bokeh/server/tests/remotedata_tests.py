import json
import tempfile
import time
import datetime as dt
import numpy as np
import pandas as pd
from os.path import dirname, join, exists

import requests
from six.moves.urllib.parse import urlencode
from unittest import skip

from . import test_utils
from ...session import Session
from ...tests.test_utils import skipIfPyPy
from unittest import skipIf
arraymanagement_missing = False
try:
    import arraymanagement
except:
    arraymanagement_missing = True
    


    
datadir = join(dirname(dirname(dirname(dirname(__file__)))), 'remotedata')


class RemoteDataTestCase(test_utils.BokehServerTestCase):
    options = {'data_directory': datadir}

    @skipIf(arraymanagement_missing, "array management not installed")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_list(self):
        config = tempfile.mkdtemp()
        s = Session(configdir=config)
        sources = s.list_data()
        result = set(['/defaultuser/GOOG.hdf5',
                      '/defaultuser/FB.hdf5',
                      '/defaultuser/MSFT.hdf5',
                      '/defaultuser/AAPL.hdf5',
                      '/defaultuser/volume.table',
                      '/defaultuser/array.table'
                  ])
        assert result == set(sources)

    @skipIf(arraymanagement_missing, "array management not installed")
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_line_downsample(self):
        config = tempfile.mkdtemp()
        s = Session(configdir=config)
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
        
temp_data_dir = tempfile.mkdtemp(prefix="remote_data_test")
class RemoteDataTestCase(test_utils.BokehServerTestCase):
    options = {'data_directory':  temp_data_dir}
    
    @skipIf(arraymanagement_missing, "array management not installed")    
    @skipIfPyPy("gevent requires pypycore and pypy-hacks branch of gevent.")
    def test_upload(self):
        f = join(datadir, "defaultuser", "AAPL.hdf5")
        url = "http://localhost:5006/bokeh/data/upload/defaultuser/myfile.hdf5"
        with open(f) as myfile:
            result = requests.post(url, files={'file' : ("myfile.hdf5", myfile)})
        assert result.content == "/defaultuser/myfile.hdf5"
        destination = join(temp_data_dir, "defaultuser", "myfile.hdf5")
        assert exists(destination)
        
    @skipIf(arraymanagement_missing, "array management not installed")
    def test_client(self):
        s = Session()
        fname = s._prep_data_source_numpy("foo", np.array([1,2,3,4,5]))
        assert exists(fname)
        data = pd.DataFrame({'a' : [1,2,3,4,5], 'b' :[1,2,3,4,5]})
        fname = s._prep_data_source_df("foo", data)
        assert exists(fname)
        
        
        
