import six
import pandas as pd
import numpy as np

from .objects import ColumnDataSource, Range1d, FactorRange, GridPlot, Widget, DataSource
from .plot_object import PlotObject
from bokeh.plotting import (curdoc, cursession, line,
                            scatter)
from .properties import (HasProps, Dict, Enum, Either, Float, Instance, Int, List,
    String, Color, Bool, Tuple, Any, Date, RelativeDelta, lookup_descriptor)
from .enums import ColumnType, ButtonType, NamedIcon
from .pivot_table import pivot_table
import copy
import logging
logger = logging.getLogger(__name__)

import pandas as pd

class AbstractIcon(Widget):
    pass

class Icon(AbstractIcon):
    name = Enum(NamedIcon)
    size = Float(None)
    flip = Enum("horizontal", "vertical", default=None)
    spin = Bool(False)

class AbstractButton(Widget):
    label = String("Button")
    icon = Instance(AbstractIcon)
    type = Enum(ButtonType)

class Button(AbstractButton):
    clicks = Int(0)

    def on_click(self, handler):
        self.on_change('clicks', lambda obj, attr, old, new: handler())

class Toggle(AbstractButton):
    active = Bool(False)

    def on_click(self, handler):
        self.on_change('clicks', lambda obj, attr, old, new: handler(new))

class Dropdown(AbstractButton):
    pass

class AbstractGroup(Widget):
    labels = List(String)
    # active = AbstractProperty

    def on_click(self, handler):
        self.on_change('active', lambda obj, attr, old, new: handler(new))

class Group(AbstractGroup):
    inline = Bool(False)

class ButtonGroup(AbstractGroup):
    type = Enum(ButtonType)

class CheckboxGroup(Group):
    active = List(Int)

class RadioGroup(Group):
    active = Int(None)

class CheckboxButtonGroup(ButtonGroup):
    active = List(Int)

class RadioButtonGroup(ButtonGroup):
    active = Int(None)

class Panel(Widget):
    title = String
    child = Instance(Widget)
    closable = Bool(False)

class Tabs(Widget):
    tabs = List(Instance(Panel))
    active = Int(0)

class Dialog(Widget):
    visible = Bool(False)
    closable = Bool(True)
    title = String
    content = String
    buttons = List(String)

class Layout(Widget):
    width = Int
    height = Int

class HBox(Layout):
    children = List(Instance(Widget))
class VBox(Layout):
    children = List(Instance(Widget))

#parent class only, you need to set the fields you want
class VBoxForm(VBox):
    pass

class InputWidget(Widget):
    title = String()
    name = String()
    value = String()
    @classmethod
    def coerce_value(cls, val):
        prop_obj = lookup_descriptor(cls, 'value')
        if isinstance(prop_obj, Float):
            return float(val)
        elif isinstance(prop_obj, Int):
            return int(val)
        elif isinstance(prop_obj, String):
            return str(val)
        else:
            return val

    @classmethod
    def create(cls, *args, **kwargs):
        """Only called the first time we make an object,
        whereas __init__ is called every time it's loaded
        """
        if kwargs.get('title') is None:
            kwargs['title'] = kwargs['name']
        if kwargs.get('value') is not None:
            kwargs['value'] = cls.coerce_value(kwargs.get('value'))
        return cls(**kwargs)

class TextInput(InputWidget):
    value = String()

class Paragraph(Widget):
    text = String()
    width = Int(500)
    height = Int(400)

class PreText(Paragraph):
    pass

class Select(InputWidget):
    options = List(Either(String, Dict(String, String)))
    value = String

    @classmethod
    def create(self, *args, **kwargs):
        options = kwargs.pop('options', [])
        new_options = []
        for opt in options:
            if isinstance(opt, six.string_types):
                opt = {'name' : opt, 'value' : opt}
            new_options.append(opt)
        kwargs['options'] = new_options
        return super(Select, self).create(*args, **kwargs)

class MultiSelect(Select):
    value = List(String)

    @classmethod
    def create(self, *args, **kwargs):
        options = kwargs.pop('options', [])
        new_options = []
        for opt in options:
            if isinstance(opt, six.string_types):
                opt = {'name' : opt, 'value' : opt}
            new_options.append(opt)
        kwargs['options'] = new_options
        return super(Select, self).create(*args, **kwargs)

class Slider(InputWidget):
    value = Float()
    start = Float()
    end = Float()
    step = Int()
    orientation = Enum("horizontal", "vertical")

class DateRangeSlider(InputWidget):
    value = Tuple(Date, Date)
    bounds = Tuple(Date, Date)
    range = Tuple(RelativeDelta, RelativeDelta)
    step = RelativeDelta
    # formatter = Either(String, Function(Date))
    # scales = DateRangeSliderScales ... # first, next, stop, label, format
    enabled = Bool(True)
    arrows = Bool(True)
    value_labels = Enum("show", "hide", "change")
    wheel_mode = Enum("scroll", "zoom", default=None) # nullable=True

class DatePicker(InputWidget):
    value = Date
    min_date = Date(default=None)
    max_date = Date(default=None)

class TableWidget(Widget):
    pass

class TableColumn(Widget):
    field = String
    header = String
    type = Enum(ColumnType)
    format = String
    source = List(String)
    strict = Bool(False)
    checked = String("true")
    unchecked = String("false")

class HandsonTable(TableWidget):
    source = Instance(DataSource)
    columns = List(Instance(TableColumn))
    sorting = Bool(True)
    width = Int(None)
    height = Int(None)

class ObjectExplorer(Widget):
    data_widget = Instance(TableWidget)

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
