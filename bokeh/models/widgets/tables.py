from __future__ import absolute_import

import pandas as pd

from ...pivot_table import pivot_table
from ...properties import Any, Bool, Int, String, Enum, Instance, List, Dict
from ...enums import ColumnType
from ..widget import Widget
from ..sources import DataSource

class TableWidget(Widget):
    source = Instance(DataSource)

class TableColumn(Widget):
    field = String
    header = String
    type = Enum(ColumnType)
    width = Int(None)
    format = String
    source = List(String)
    strict = Bool(False)
    checked = String("true")
    unchecked = String("false")

class HandsonTable(TableWidget):
    columns = List(Instance(TableColumn))
    columns_width = Int(None)
    sorting = Bool(True)
    width = Int(None)
    height = Int(None)
    row_headers = Bool(True)
    column_headers = Bool(True)
    row_resize = Bool(False)
    column_resize = Bool(False)

class DataTable(Widget):
    source = Instance(DataSource)
    sort = List(String)
    group = List(String)
    offset = Int(default=0)
    length = Int(default=100)
    maxlength = Int
    totallength = Int
    tabledata = Dict(String, Any)
    filterselected = Bool(default=False)

    def setup_events(self):
        self.on_change('sort', self, 'get_data')
        self.on_change('group', self, 'get_data')
        self.on_change('length', self, 'get_data')
        self.on_change('offset', self, 'get_data')
        self.on_change('filterselected', self, 'get_data')
        self.source.on_change('selected', self, 'get_data')
        self.source.on_change('data', self, 'get_data')
        self.source.on_change('computed_columns', self, 'get_data')
        if not self.tabledata:
            self.get_data()

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
        self.maxlength = data.pop('maxlength')
        self.totallength = data.pop('totallength')
        self.tabledata = data

class PivotTable(Widget):
    source = Instance(DataSource)
    title = String("Pivot Table")
    description = String("")
    data = Dict(String, Any)
    fields = List(Any) # List[{name: String, dtype: String}]
    rows = List(Any)
    columns = List(Any)
    values = List(Any)
    filters = List(Any)
    manual_update = Bool(True)

    def setup_events(self):
        self.on_change('rows', self, 'get_data')
        self.on_change('columns', self, 'get_data')
        self.on_change('values', self, 'get_data')
        self.on_change('filters', self, 'get_data')

        if not self.data:
            self.get_data()

    def get_data(self, obj=None, attrname=None, old=None, new=None):
        self.data = self.pivot_table()

    def _pivot_table(self, rows, cols, values, aggfunc=None):
        dataset = pd.DataFrame(self.source.data)

        try:
            if not rows and not cols:
                table = pd.DataFrame()
            else:
                table = pivot_table(dataset, rows=rows, cols=cols, values=values, aggfunc=aggfunc)
        except:
            table = pd.DataFrame()

        if isinstance(table, pd.DataFrame):
            if len(rows) == 1:
                _rows = [ [x] for x in table.index.tolist() ]
            else:
                _rows = table.index.tolist()
            if len(cols) == 1:
                _cols = [ [x] for x in table.columns.tolist() ]
            else:
                _cols = table.columns.tolist()
            _values = table.values.tolist()
            _attrs = dataset.columns.tolist()
        elif isinstance(table, pd.Series):
            raise ValueError("series")
        else:
            raise ValueError("???")

        return table, (_attrs, _rows, _cols, _values)

    def pivot_table(self):
        def fields(items):
           return [ item["field"] for item in items ]

        row_fields = fields(self.rows)
        column_fields = fields(self.columns)
        value_fields = fields(self.values)
        filter_fields = fields(self.filters)

        if len(self.values) > 0:
            aggfunc = self.values[0]["aggregate"]
        else:
            aggfunc = len

        _, (_attrs, _rows, _cols, _values) = self._pivot_table(row_fields, column_fields, value_fields, aggfunc)

        return dict(
            attrs  = _attrs,
            rows   = _rows,
            cols   = _cols,
            values = _values,
        )
