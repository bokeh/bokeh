import pandas
import json

from bokeh.properties import (HasProps, MetaHasProps, 
        Any, Dict, Enum, Float, Instance, Int, List, String,
        Color, Pattern, Percent, Size)

#loading dependencies
import bokeh.objects
import bokeh.glyphs

from bokeh.objects import PlotObject, Plot
from bokeh.session import PlotContext, PlotList
    
class IPythonRemoteData(PlotObject):
    host  = String("localhost")
    port = Int(10020)
    varname = String() 
    #hack... we're just using this field right now to trigger events
    selected = Int
    
class PandasPivotTable(PlotObject):
    source = Instance(has_ref=True)
    sort = List()
    group = List()
    offset = Int(default=0)
    length = Int(default=100)
    precision = Dict()
    tabledata = Dict()
    selected = List()
    
    def __init__(self, *args, **kwargs):
        super(PandasPivotTable, self).__init__(*args, **kwargs)
        self._callbacks.clear()
        self.on_change('sort', self, 'get_table_data')
        self.on_change('group', self, 'get_table_data')
        self.on_change('length', self, 'get_table_data')
        self.on_change('offset', self, 'get_table_data')
        self.on_change('precision', self, 'get_table_data')
        
    def select(self, select):
        import requests        
        remotedata = self.source
        url = "http://%s:%s/array/%s/select" % (remotedata.host,
                                                remotedata.port,
                                                remotedata.varname)
        data = self.transform()
        data['selected'] = select
        requests.post(url, data=json.dumps(data))
        self.get_table_data()
        
    def deselect(self, deselect):
        import requests        
        remotedata = self.source
        url = "http://%s:%s/array/%s/deselect" % (remotedata.host,
                                                remotedata.port,
                                                remotedata.varname)
        data = self.transform()
        data['selected'] = deselect
        requests.post(url, data=json.dumps(data))
        self.get_table_data()
        
    def transform(self):
        return dict(sort=self.sort,
                    group=self.group,
                    offset=self.offset,
                    length=self.length,
                    )
                    
    def get_table_data(self, obj=None, attrname=None, old=None, new=None):
        print 'GET TABLE DATA'
        import requests
        remotedata = self.source
        url = "http://%s:%s/array/%s" % (remotedata.host,
                                         remotedata.port,
                                         remotedata.varname)
        data = requests.get(url, data=json.dumps(self.transform())).json()
        print data['data']['_selected']
        self.format_data(data)
        self.tabledata = data
        
    def format_data(self, jsondata):
        """inplace manipulation of jsondata
        """
        precision = self.precision
        for colname, data in jsondata.iteritems():
            for idx, val in enumerate(data):
                if isinstance(val, float):
                    data[idx] = "%%.%df" % precision.get(colname,2)%data[idx]
        
    
    
