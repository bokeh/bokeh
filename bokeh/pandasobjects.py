from __future__ import absolute_import, print_function

import time
import numpy as np
import requests

from . import protocol
from .objects import ColumnDataSource, PlotObject
from .properties import (Bool, Dict, Instance, Int, List, String)

# Hugo: this object model is still a bit half baked
# we are probabyl storing some things on the plot source and
# pivot table that we should store on the IPythonRemoteData

class IPythonRemoteData(PlotObject):
    host  = String("localhost")
    port = Int(10020)
    varname = String()
    computed_columns = List()
    metadata = Dict()

    #hack... we're just using this field right now to trigger events
    selected = Int(0)
    data = Int(0)

    def setselect(self, select, transform):

        remotedata = self
        url = "http://%s:%s/array/%s/setselect" % (remotedata.host,
                                                remotedata.port,
                                                remotedata.varname)
        data = transform
        data['selected'] = select
        requests.post(url, data=protocol.serialize_json(data))
        self.selected += 1

    def search(self, search):
        remotedata = self
        url = "http://%s:%s/array/%s/search" % (remotedata.host,
                                                remotedata.port,
                                                remotedata.varname)
        requests.post(url, data=search)
        self.selected += 1

    def select(self, select, transform):

        remotedata = self
        url = "http://%s:%s/array/%s/select" % (remotedata.host,
                                                remotedata.port,
                                                remotedata.varname)
        data = transform
        data['selected'] = select
        requests.post(url, data=protocol.serialize_json(data))
        self.selected += 1

    def deselect(self, deselect, transform):
        remotedata = self
        url = "http://%s:%s/array/%s/deselect" % (remotedata.host,
                                                  remotedata.port,
                                                  remotedata.varname)
        data = transform
        data['selected'] = deselect
        requests.post(url, data=protocol.serialize_json(data))
        self.selected += 1

    def get_data(self, transform):
        remotedata = self
        url = "http://%s:%s/array/%s" % (remotedata.host,
                                         remotedata.port,
                                         remotedata.varname)
        data = requests.get(url, data=protocol.serialize_json(transform)).json()
        self.metadata = data.pop('metadata', {})
        return data

    def set_computed_columns(self, computed_columns):

        remotedata = self
        url = "http://%s:%s/array/%s/computed" % (remotedata.host,
                                                  remotedata.port,
                                                  remotedata.varname)
        data = requests.get(
            url,
            data=protocol.serialize_json(computed_columns)).json()
        self.computed_columns = computed_columns
        self.data += 1
        return data


class PandasPlotSource(ColumnDataSource):
    source = Instance(has_ref=True)

    def __init__(self, *args, **kwargs):
        super(PandasPlotSource, self).__init__(*args, **kwargs)

    def setup_events(self):
        self.on_change('selected', self, 'selection_callback')
        self.source.on_change('selected', self, 'get_data')
        self.source.on_change('data', self, 'get_data')
        self.source.on_change('computed_columns', self, 'get_data')
        if not self.data:
            self.get_data()

    def selection_callback(self, obj=None, attrname=None, old=None, new=None):
        self.setselect(self.selected)

    def transform(self):
        return {}

    def setselect(self, select):
        self.source.setselect(select, self.transform())
        self.get_data()

    def select(self, select):
        self.source.select(select, self.transform())
        self.get_data()

    def deselect(self, deselect):
        self.source.deselect(deselect, self.transform())
        self.get_data()

    def get_data(self, obj=None, attrname=None, old=None, new=None):
        data = self.source.get_data(self.transform())
        #ugly:
        self._selected =  np.nonzero(data['data']['_selected'])[0]
        self.maxlength = data.pop('maxlength')
        self.totallength = data.pop('totallength')
        self.column_names = data['column_names']
        self.data = data['data']


class PandasPivotTable(PlotObject):
    source = Instance(has_ref=True)
    sort = List()
    group = List()
    offset = Int(default=0)
    length = Int(default=100)
    maxlength = Int()
    totallength = Int()
    precision = Dict()
    tabledata = Dict()
    filterselected = Bool(default=False)
    def setup_events(self):
        self.on_change('sort', self, 'get_data')
        self.on_change('group', self, 'get_data')
        self.on_change('length', self, 'get_data')
        self.on_change('offset', self, 'get_data')
        self.on_change('precision', self, 'get_data')
        self.on_change('filterselected', self, 'get_data')
        self.source.on_change('selected', self, 'get_data')
        self.source.on_change('data', self, 'get_data')
        self.source.on_change('computed_columns', self, 'get_data')
        if not self.tabledata:
            self.get_data()

    def format_data(self, jsondata):
        """inplace manipulation of jsondata
        """
        precision = self.precision
        for colname, data in jsondata.iteritems():
            if colname == '_selected' or colname == '_counts':
                continue
            if self.source.metadata.get(colname, {}).get('date'):
                isdate = True
            else:
                isdate = False
            for idx, val in enumerate(data):
                if isdate:
                    timeobj = time.localtime(val/1000.0)
                    data[idx] = time.strftime("%Y-%m-%d %H:%M:%S", timeobj)
                if isinstance(val, float):
                    data[idx] = "%%.%df" % precision.get(colname,2)%data[idx]

    def transform(self):
        return dict(sort=self.sort,
                    group=self.group,
                    offset=self.offset,
                    length=self.length,
                    filterselected=self.filterselected,
                    )

    def setselect(self, select):
        self.source.setselect(select, self.transform())
        self.get_data()

    def select(self, select):
        self.source.select(select, self.transform())
        self.get_data()

    def deselect(self, deselect):
        self.source.deselect(deselect, self.transform())
        self.get_data()

    def get_data(self, obj=None, attrname=None, old=None, new=None):
        data = self.source.get_data(self.transform())
        print(data['data']['_selected'])
        self.maxlength = data.pop('maxlength')
        self.totallength = data.pop('totallength')
        self.format_data(data['data'])
        self.tabledata = data

