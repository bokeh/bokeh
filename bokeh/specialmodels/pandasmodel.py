from ..bbmodel import ContinuumModel, register_type
from ..data import make_source

import cPickle as pickle
class PandasModel(ContinuumModel):
    """Pandas class
    attributes:
        path : filesystem path of pickled pandas data
        sort : list of columns to sort by
        groups : list of columns to group by (not implemented)
        agg : agg function (not implemented)
        offset : offset for pagination
        length : length of data for pagination
        data : dataframe output
    """
    def offset(self):
        return self.get('offset', 0)
    
    def length(self):
        return self.get('length', None)
    
    def groups(self):
        return self.get('groups', [])
    
    def agg(self):
        return self.get('agg', 'sum')
    
    def get_data(self):
        if not hasattr(self, 'data'):
            with open(self.get('path')) as f:
                self.data = pickle.load(f)
        data = self.data
        if self.groups() and self.agg():
            data = data.groupby(self.groups())
            data = getattr(data, self.agg())()
        if self.get('sort'):
            data = data.sort(self.get('sort'))
        data = data[self.offset():self.length()]
        return make_source(index=data.index, **data)
        
    
    def to_json(self):
        data = self.get_data()
        self.set('data', data)
        return self.attributes

register_type('Pandas', PandasModel)
