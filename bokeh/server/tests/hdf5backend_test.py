import unittest
import tempfile
import shutil
from os.path import join
from cStringIO import StringIO

import pandas as pd
import numpy as np

from ..server_backends import HDF5DataBackend
from ...session import Session

class BackendTestCase(unittest.TestCase):
    def setUp(self):
        self.path = tempfile.mkdtemp()
        self.backend = HDF5DataBackend(self.path)

    def tearDown(self):
        shutil.rmtree(self.path)

    def test_write(self):
        f = StringIO()
        f.write("foobarbaz")
        f.seek(0)
        retval = self.backend.write('myuser', 'myfile.txt', f)
        assert retval == "myuser/myfile.txt"
        with open(join(self.path, retval)) as f:
            assert f.read() == 'foobarbaz'

    def test_get_pandas(self):
        s = Session()
        df = pd.DataFrame({'a' : [1,2,3,4,5], 'b' : [1,2,3,4,5]})
        fpath = s._prep_data_source_df('dummy', df)
        with open(fpath, "rb") as f:
            self.backend.write('myuser', 'dummy.hdf5', f)
        store, name = self.backend.load_pandas('myuser/dummy.hdf5::dummy::pandas')
        result = store.select(name)
        assert result.shape == (5, 2)

    def test_get_numpy(self):
        s = Session()
        data = np.random.random((10,10,10))
        fpath = s._prep_data_source_numpy('dummy', data)
        with open(fpath, "rb") as f:
            self.backend.write('myuser', 'dummy.hdf5', f)
        arr = self.backend.load_numpy('myuser/dummy.hdf5::dummy::numpy')
        assert arr.shape == (10, 10, 10)
