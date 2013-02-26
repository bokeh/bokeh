import uuid
import base64
import cPickle as pickle
import numpy as np

from ..bbmodel import ContinuumModel, register_type
from ..data import make_source

class PandasDataSource(ContinuumModel):
    # FIXME: this is a little redundant with pandas_plot_data.py..
    # we should figure out how to unify this later
    """PandasDataSource.  This class represents serverside data.
    When you use it, you should a PandasPivotModel, or a PandasPlotSource
    at it.
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
        
class PandasPlotSource(ContinuumModel):
    """
    attributes:
        pandassource : reference to PandasDataSource
        data : dataframe output
    """
    def __init__(self, typename, **kwargs):
        if 'client' in kwargs:
            self.client = kwargs.pop('client')
        elif 'pandassourceobj' in kwargs:
            self.pandassource = kwargs.pop('pandassourceobj')
            kwargs['pandassource'] = self.pandassource.ref()
        super(PandasPlotSource, self).__init__(typename, **kwargs)
        
    def get_data(self):
        if not hasattr(self, 'pandassource'):
            self.pandassource = self.client.get(
                self.get('pandassource')['type'],
                self.get('pandassource')['id'],
                include_hidden=True
                )
        self.pandassource.ensure_data()
        data = self.pandassource.data
        return data

    def to_json(self, include_hidden=False):
        data = self.get_data()
        data = make_source(index=data.index, **data)
        self.set('data', data)
        return self.attributes

class PandasPivotModel(PandasPlotSource):
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
    def offset(self):
        return self.get('offset', 0)
    
    def length(self):
        return self.get('length', None)
    
    def groups(self):
        return self.get('groups', [])
    
    def agg(self):
        return self.get('agg', 'sum')
    
    def get_selection(self):
        """computes selection of aggregated data from pandassourceobj
        """
    def get_slice(self, data):
        data = data[self.offset():self.offset() + self.length()]
        return data
        
    def get_data(self):
        data = super(PandasPivotModel, self).get_data()
        #add counts/selected, so we can compute counts and selections
        #we will pop them off later
        data['_counts'] = np.ones(len(data))
        data['_selected'] = np.zeros(len(data))
        raw_selected = self.pandassource.get('selected', []) # integer list
        data.ix[raw_selected, '_selected'] = 1
        if self.groups() and self.agg():
            self.groupobj = data.groupby(self.groups())
            data = getattr(self.groupobj, self.agg())()
        else:
            self.groupobj = None
        if self.get('sort'):
            data = data.sort(self.get('sort'))
        self.fulldata = data
        if np.sum(data._selected) > 1 and not self.groupobj:
            # in the non group by case, we filter on selection
            # otherwise we output the # of selected items
            data = data.ix[data._selected==1, :]
        self.totallength = len(data)
        self.data = self.get_slice(data)
        self.data.pop('_counts')
        self.data.pop('_selected')
        return self.data
    
    def to_json(self, include_hidden=False):
        data = self.get_data()
        if self.groupobj:
            stats = self.get_slice(self.groupobj.sum())
            counts = stats['_counts'].tolist()
            selected = stats['_selected'].tolist()
        else:
            counts = None
            selected = self.get_slice(self.fulldata)['_selected']
        columns = ['index'] + data.columns.tolist()
        data = make_source(index=data.index, **data)
        self.set('selected', selected)
        self.set('data', data)
        self.set('maxlength', self.totallength)
        if self.get('offset') > self.get('maxlength'):
            self.set('offset', 0)
        self.set('columns', columns)
        self.set('counts', counts)
        return self.attributes

register_type('PandasPivot', PandasPivotModel)
register_type('PandasDataSource', PandasDataSource)
register_type('PandasPlotSource', PandasPlotSource)
