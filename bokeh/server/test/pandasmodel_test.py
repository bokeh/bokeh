import unittest
from ...specialmodels.pandasmodel import PandasModel
from ...bbmodel import make_model, ContinuumModel
import tempfile
import cPickle as pickle
import pandas

class PandasModelTestCase(unittest.TestCase):
    def setUp(self):
        self.tempfile = tempfile.NamedTemporaryFile()
        df = pandas.DataFrame({
            'vals' : [5,4,3,2,1],
            'types' : ['b','b','a','a','a']
            })
        pickle.dump(df, self.tempfile)
        self.tempfile.flush()
        
    def test_pandas_instantiation(self):
        temp = make_model('newtype', x=1)
        assert isinstance(temp, ContinuumModel)
        assert not isinstance(temp, PandasModel)
        temp = PandasModel('Pandas', x=1)
        assert isinstance(temp, PandasModel)
        temp = make_model('Pandas', x=1)
        assert isinstance(temp, PandasModel)
        
    def test_data_to_json(self):
        data = make_model('Pandas', path=self.tempfile.name)
        temp = data.to_json()
        data = [{'vals': 5, 'index': 0, 'types': 'b'},
                {'vals': 4, 'index': 1, 'types': 'b'},
                {'vals': 3, 'index': 2, 'types': 'a'},
                {'vals': 2, 'index': 3, 'types': 'a'},
                {'vals': 1, 'index': 4, 'types': 'a'}]
        assert data == temp['data']
        
    def test_data_sorting(self):
        data = make_model('Pandas', path=self.tempfile.name,
                          sort=['vals'])
        temp = data.to_json()
        assert temp['data'][0]['vals'] == 1
        
    def test_data_groupby(self):
        data = make_model('Pandas', path=self.tempfile.name,
                          sort=['vals'], groups=['types'])
        temp = data.to_json()        
        data = [{'vals': 6.0, 'index': 'a'}, {'vals': 9.0, 'index': 'b'}]
        assert temp['data'] == data
        
