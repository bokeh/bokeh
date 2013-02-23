import uuid
import base64
import cPickle as pickle

from ..bbmodel import ContinuumModel, LazyModel, register_type
from ..data import make_source
class PandasDataSource(LazyModel):
    # FIXME: this is a little redundant with pandas_plot_data.py..
    # we should figure out how to unify this later
    """PandasDataSource
    attributes:
        pickled : pickled dataframe.
    you can also pass in df, which will be pickled, but df will not be
    stored as a backbone attribute
    """
    def __init__(self, typename, **kwargs):
        if 'df' in kwargs:
            df = kwargs.pop('df')
            kwargs['encoded'] = base64.b64encode(pickle.dumps(df, -1))
            self.data = df
        super(PandasDataSource, self).__init__(typename, **kwargs)
        
    def ensure_data(self):
        if not hasattr(self, 'data'):
            self.data = pickle.loads(base64.b64decode(self.get('encoded')))
        

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
