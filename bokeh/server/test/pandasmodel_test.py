import unittest
from ...specialmodels.pandasmodel import PandasPivotModel, PandasDataSource
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
        self.datasource = PandasDataSource(
            'PandasDataSource', df=df, path=self.tempfile.name)
        
    def test_pandas_instantiation(self):
        temp = make_model('newtype', x=1)
        assert isinstance(temp, ContinuumModel)
        assert not isinstance(temp, PandasPivotModel)
        temp = PandasPivotModel('PandasPivot',
                                pandassourceobj=self.datasource)
        assert isinstance(temp, PandasPivotModel)
        temp = make_model('PandasPivot',
                          pandassourceobj=self.datasource)
        assert isinstance(temp, PandasPivotModel)
        
    def test_data_to_json(self):
        model = make_model('PandasPivot',
                          pandassourceobj=self.datasource)
        temp = model.to_json()
        data = [{'vals': 5, 'index': 0, 'types': 'b'},
                {'vals': 4, 'index': 1, 'types': 'b'},
                {'vals': 3, 'index': 2, 'types': 'a'},
                {'vals': 2, 'index': 3, 'types': 'a'},
                {'vals': 1, 'index': 4, 'types': 'a'}]
        assert data == temp['data']
        
    def test_data_sorting(self):
        model = make_model('PandasPivot',
                          pandassourceobj=self.datasource,
                          sort=['vals']
                          )
        temp = model.to_json()
        assert temp['data'][0]['vals'] == 1
        
    def test_data_groupby(self):
        model = make_model('PandasPivot',
                          pandassourceobj=self.datasource,
                          sort=['vals'],
                          groups=['types']
                          )
        temp = model.to_json()        
        data = [{'vals': 6.0, 'index': 'a'}, {'vals': 9.0, 'index': 'b'}]
        assert temp['data'] == data
        
    
