import unittest
from ...specialmodels.pandasmodel import PandasModel
from ...bbmodel import make_model, ContinuumModel

class PandasModelTestCase(unittest.TestCase):
    def test_pandas_instantiation(self):
        temp = make_model('newtype', x=1)
        assert isinstance(temp, ContinuumModel)
        assert not isinstance(temp, PandasModel)
        temp = PandasModel('Pandas', x=1)
        assert isinstance(temp, PandasModel)
        temp = make_model('Pandas', x=1)
        assert isinstance(temp, PandasModel)
        
