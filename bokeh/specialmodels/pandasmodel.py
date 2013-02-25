import uuid
import base64
import cPickle as pickle

from ..bbmodel import ContinuumModel, register_type
from ..data import make_source
class PandasDataSource(ContinuumModel):
    # FIXME: this is a little redundant with pandas_plot_data.py..
    # we should figure out how to unify this later
    """PandasDataSource
    attributes:
        pickled : pickled dataframe.
    you can also pass in df, which will be pickled, but df will not be
    stored as a backbone attribute
    """
    hidden_fields = ('encoded',)
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
                
    def get_data(self, return_counts=False):
        if not hasattr(self, 'pandassource'):
            self.pandassource = self.client.get(
                self.get('pandassource')['type'],
                self.get('pandassource')['id'],
                include_hidden=True
                )
        self.pandassource.ensure_data()
        data = self.pandassource.data
        data.groupby('types')
        counts = None
        if self.groups() and self.agg():
            data = data.groupby(self.groups())
            counts = data.count().ix[:,0].to_dict()
            data = getattr(data, self.agg())()
        if self.get('sort'):
            data = data.sort(self.get('sort'))
        data = data[self.offset():self.length()]
        if return_counts:
            return data, counts
        else:
            return data
    
    def to_json(self, include_hidden=False):
        data, counts = self.get_data(return_counts=True)
        columns =  ['index'] + data.columns.tolist()
        data = make_source(index=data.index, **data)
        self.set('data', data)
        self.set('maxlength', len(data))
        self.set('columns', columns)
        self.set('counts', counts)
        return self.attributes

register_type('PandasPivot', PandasPivotModel)

register_type('PandasDataSource', PandasDataSource)
