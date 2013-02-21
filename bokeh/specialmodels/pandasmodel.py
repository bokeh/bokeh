from ..bbmodel import ContinuumModel, register_type
from ..data import make_source
import uuid

import cPickle as pickle
class PandasDataSource(ContinuumModel):
    # FIXME: this is a little redundant with pandas_plot_data.py..
    # we should figure out how to unify this later
    """PandasDataSource
    attributes:
        path : 
    """
    def __init__(self, typename, **kwargs):
        if 'df' in kwargs:
            df = kwargs.pop('df')
            if 'path' not in kwargs:
                kwargs['path'] = str(uuid.uuid4()) + ".pandas"
            with open(kwargs.get('path'), "w+") as f:
                pickle.dump(df, f, -1)
            self.data = df
        self.ensure_data()
        super(PandasDataSource, self).__init__(typename, **kwargs)
        
    def ensure_data(self):
        if not hasattr(self, 'data'):
            with open(self.get('path')) as f:
                self.data = pickle.load(f)
        

class PandasPivotModel(ContinuumModel):
    """Pandas Pivot table class
    you must pass either a client in to kwargs, or pandassourceobj
    which is an instance of PandasDataSource
    
    attributes:
        pandassource : reference to PandasDataSource
        sort : list of columns to sort by
        groups : list of columns to group by (not implemented)
        agg : agg function (not implemented)
        offset : offset for pagination
        length : length of data for pagination
        data : dataframe output
    """
    def __init__(self, typename, **kwargs):
        if 'client' in kwargs:
            self.client = kwargs.pop('client')
            self.pandassource = self.client.get(
                kwargs.get('pandassource')['type'],
                kwargs.get('pandassource')['id']
                )
        elif 'pandassourceobj' in kwargs:
            self.pandassource = kwargs.pop('pandassourceobj')
            kwargs['pandassource'] = self.pandassource.ref()
        else:
            raise Exception, 'need to pass client, or pandas source obj'
        super(PandasPivotModel, self).__init__(typename, **kwargs)

            
    def offset(self):
        return self.get('offset', 0)
    
    def length(self):
        return self.get('length', None)
    
    def groups(self):
        return self.get('groups', [])
    
    def agg(self):
        return self.get('agg', 'sum')
    
                
    def get_data(self):
        self.pandassource.ensure_data()
        data = self.pandassource.data
        if self.groups() and self.agg():
            data = data.groupby(self.groups())
            data = getattr(data, self.agg())()
        if self.get('sort'):
            data = data.sort(self.get('sort'))
        data = data[self.offset():self.length()]
        return data
    
    def to_json(self):
        data = self.get_data()
        columns =  ['index'] + data.columns.tolist()
        data = make_source(index=data.index, **data)
        self.set('data', data)
        self.set('columns', columns)
        return self.attributes

register_type('PandasPivot', PandasPivotModel)

register_type('PandasDataSource', PandasDataSource)
