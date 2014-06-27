import six
import pandas as pd
import numpy as np

from .objects import ColumnDataSource, Range1d, FactorRange, GridPlot, Widget, DataSource
from .utils.plotting import (make_histogram_source, make_factor_source,
                             make_histogram, make_continuous_bar_source,
                             make_categorical_bar_source,
                             make_bar_plot, cross
                         )
from .plot_object import PlotObject
from bokeh.plotting import (curdoc, cursession, line,
                            scatter)
from .properties import (HasProps, Dict, Enum, Either, Float, Instance, Int, List,
    String, Color, Include, Bool, Tuple, Any, Date, RelativeDelta, lookup_descriptor)
from .pivot_table import pivot_table
import copy
import logging
logger = logging.getLogger(__name__)

import pandas as pd

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
    pass

class HBox(Layout):
    children = List(Instance(Widget))
class VBox(Layout):
    children = List(Instance(Widget))

#parent class only, you need to set the fields you want
class VBoxModelForm(Widget):
    _children  = List(Instance(Widget))
    _field_defs = Dict(String, Any)
    input_specs = None
    jsmodel = "VBoxModelForm"
    def __init__(self, *args, **kwargs):
        super(VBoxModelForm, self).__init__(*args, **kwargs)
        for prop in self.properties():
            propobj = lookup_descriptor(self.__class__, prop)
            if isinstance(propobj, Float):
                self._field_defs[prop] = "Float"
            elif isinstance(propobj, Int):
                self._field_defs[prop] = "Int"
            else:
                self._field_defs[prop] = "String"
    def create_inputs(self, doc):
        if self.input_specs:
            for input_spec in self.input_specs:
                input_spec = copy.copy(input_spec)
                widget = input_spec.pop('widget')
                widget = widget.create(**input_spec)
                self._children.append(widget)


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

class BokehApplet(Widget):
    modelform = Instance(VBoxModelForm)
    children = List(Instance(Widget))
    jsmodel = "HBox"
    # Change to List because json unpacks tuples into lists
    extra_generated_classes = List(List(String))

    def update(self, **kwargs):
        super(BokehApplet, self).update(**kwargs)
        self.setup_events()

    def setup_events(self):
        if self.modelform:
            self.bind_modelform()

    def bind_modelform(self):
        for prop in self.modelform.__properties__:
            if not prop.startswith("_"):
                self.modelform.on_change(prop, self,
                                         'input_change')

    def input_change(self, obj, attrname, old, new):
        pass

    def create(self):
        pass

    @classmethod
    def add_route(cls, route, bokeh_url):
        from bokeh.server.app import bokeh_app
        from bokeh.pluginutils import app_document
        from flask import render_template
        @app_document(cls.__view_model__, bokeh_url)
        def make_app():
            app = cls()
            curdoc().autostore(False)
            app.create(curdoc())
            return app

        def exampleapp():
            app = make_app()
            docid = curdoc().docid
            objid = curdoc()._plotcontext._id
            extra_generated_classes = app.extra_generated_classes
            if len(extra_generated_classes) == 0:
                extra_generated_classes.append([
                    app.__view_model__,
                    app.__view_model__,
                    app.jsmodel])
                extra_generated_classes.append([
                    app.modelform.__view_model__,
                    app.modelform.__view_model__,
                    app.modelform.jsmodel])
            return render_template(
                'applet.html',
                extra_generated_classes=extra_generated_classes,
                title=app.__class__.__view_model__,
                objid=objid,
                docid=docid,
                splitjs=bokeh_app.splitjs)
        exampleapp.__name__ = cls.__view_model__
        bokeh_app.route(route)(exampleapp)

class Paragraph(Widget):
    text = String()

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

class DiscreteFacet(object):
    def __init__(self, field, value, label=None):
        if label is None:
            label = str(value)
        self.field = field
        self.label = label
        self._value = value

    def __str__(self):
        return "%s:%s" % (self.field, self.label)

    def filter(self, df):
        return df[df[self.field] == self._value]
    __repr__ = __str__

class ContinuousFacet(DiscreteFacet):
    def __init__(self, field, value, bins, label=None):
        super(ContinuousFacet, self).__init__(field, value, label=label)
        self.bins = bins

    def filter(self, df):
        if self.bins[0] is not None:
            df = df[df[self.field] > self.bins[0]]
        if self.bins[1] is not None:
            df = df[df[self.field] <= self.bins[1]]
        return df

class CrossFilter(PlotObject):
    columns = List(Dict(String, Any))
    data = Instance(ColumnDataSource)
    filtered_data = Instance(ColumnDataSource)
    #list of datasources to use for filtering widgets
    filter_sources = Dict(String, Instance(ColumnDataSource))
    #list of columns we are filtering
    filtering_columns = List(String)
    #Dict of column name to filtering widgets
    filter_widgets = Dict(String, Instance(PlotObject))
    #Dict which aggregates all the selections from the different filtering widgets
    filtered_selections = Dict(String, Dict(String, Any))

    # list of facet vars
    facet_x = List(String, default=[])
    facet_y = List(String, default=[])
    facet_tab = List(String, default=[])

    plot_type = Enum("line", "scatter", "bar")
    x = String
    y = String
    agg = String
    color = String
    plot = Instance(PlotObject)
    plot_selector = Instance(Select)
    x_selector = Instance(Select)
    y_selector = Instance(Select)
    agg_selector = Instance(Select)

    def __init__(self, *args, **kwargs):
        if 'df' in kwargs:
            self._df = kwargs.pop('df')
            kwargs['data'] = ColumnDataSource(data=self.df)
            kwargs['filtered_data'] = ColumnDataSource(data=self.df)
        if 'plot_type' not in kwargs:
            kwargs['plot_type'] = "scatter"
        if 'agg' not in kwargs:
            kwargs['agg'] = 'sum'
        super(CrossFilter, self).__init__(*args, **kwargs)

    @classmethod
    def create(cls, **kwargs):
        obj = cls(**kwargs)
        obj.set_metadata()
        choices = obj.make_plot_choices()
        obj.update_plot_choices(choices)
        obj.set_plot()
        obj.set_input_selector()
        return obj

    def set_input_selector(self):
        select = Select.create(
            title="PlotType",
            name="plot_type",
            value=self.plot_type,
            options=["line", "scatter", "bar"])
        self.plot_selector = select
        col_names = [x['name'] for x in self.columns]
        select = Select.create(
            name="x",
            value=self.x,
            options=col_names)
        self.x_selector = select
        select = Select.create(
            name="y",
            value=self.y,
            options=col_names)
        self.y_selector = select
        select = Select.create(
            name='agg',
            value=self.agg,
            options=['sum', 'mean', 'last']
            )
        self.agg_selector = select

    def update_plot_choices(self, input_dict):
        for k,v in input_dict.iteritems():
            if getattr(self, k) is None:
                setattr(self, k, v)

    def column_descriptor_dict(self):
        column_descriptors = {}
        for x in self.columns:
            column_descriptors[x['name']] = x
        return column_descriptors

    def continuous_columns(self):
        return [x for x in self.columns if x['type'] != 'DiscreteColumn']

    def discrete_columns(self):
        return [x for x in self.columns if x['type'] == 'DiscreteColumn']

    def make_plot_choices(self):
        x, y = [x['name'] for x in self.continuous_columns()[:2]]
        return {'x' : x, 'y' : y, 'plot_type' : scatter}

    def set_plot(self):
        if self.x == self.y:
            return
        plot = self.make_plot()
        self.plot = plot
        curdoc().add_all()

    def make_plot(self):
        if len(self.facet_x) ==0 and len(self.facet_y) == 0 and len(self.facet_tab) == 0:
            return self.make_single_plot()

        if len(self.facet_x) !=0 and len(self.facet_y) == 0 and len(self.facet_tab) == 0:
            return self.make_all_facet_plot()

        if len(self.facet_x) !=0 and len(self.facet_y) != 0 and len(self.facet_tab) == 0:
            return self.make_xy_facet_plot()

    def make_facets(self, dimension):
        if dimension == 'x':
            facets = self.facet_x
        else:
            facets = self.facet_y
        column_descriptor_dict = self.column_descriptor_dict()
        start = [[]]
        for field in facets:
            if column_descriptor_dict[field]['type'] == 'DiscreteColumn':
                facets = [DiscreteFacet(field, val) for val in self.df[field].unique()]
                start = cross(start, facets)
            else:
                categorical, bins = pd.qcut(self.df[field], 4, retbins=True)
                values = categorical.levels
                bins = [[bins[idx], bins[idx+1]] for idx in range(len(bins) - 1)]
                bins[0][0] = None
                facets = [ContinuousFacet(field, value, bin) for bin, value in zip(bins, values)]
                start = cross(start, facets)

        return start

    def facet_title(self, facets):
        title = ",".join([str(x) for x in facets])
        return title

    def facet_data(self, facets, df=None):
        if df is None:
            df = self.filtered_df
        for f in facets:
            df = f.filter(df)
        return df

    def make_all_facet_plot(self):
        all_facets = self.make_facets('x')
        plots = []
        for facets in all_facets:
            title = self.facet_title(facets)
            df = self.facet_data(facets, self.filtered_df)
            plot = self.make_single_plot(
                df=df, title=title, plot_height=200, plot_width=200,
                tools="pan,wheel_zoom"
            )
            plot.min_border = 0
            plot.border_symmetry = "none"
            plots.append(plot)
        chunk_size = int(np.ceil(np.sqrt(len(plots))))
        grid_plots = []
        for i in xrange(0, len(plots), chunk_size):
            chunk =  plots[i:i+chunk_size]
            grid_plots.append(chunk)
        grid = GridPlot(children=grid_plots, plot_width=200 * chunk_size)
        return grid

    def make_xy_facet_plot(self):
        all_facets_x = self.make_facets('x')
        all_facets_y = self.make_facets('y')
        grid_plots = []
        for facets_y in all_facets_y:
            row = []
            for facets_x in all_facets_x:
                facets = facets_x + facets_y
                title = self.facet_title(facets)
                df = self.facet_data(facets, self.filtered_df)
                plot = self.make_single_plot(
                    df=df, title=title, plot_height=200, plot_width=200,
                    tools="pan,wheel_zoom"
                )
                plot.min_border = 0
                plot.border_symmetry = "none"
                row.append(plot)
            grid_plots.append(row)
        grid = GridPlot(children=grid_plots, plot_width=200 * len(all_facets_x))
        return grid


    def make_single_plot(self, df=None, title=None,
                         plot_width=500, plot_height=500,
                         tools="pan,wheel_zoom,box_zoom,save,resize,select,reset"
                     ):
        column_descriptor_dict = self.column_descriptor_dict()
        if title is None:
            title ="%s by %s" % (self.x, self.y)

        if self.plot_type == "scatter":
            if df is None:
                source = self.filtered_data
            else:
                source = ColumnDataSource(data=df)
            plot = scatter(self.x, self.y, source=source,
                           title_text_font_size="12pt",
                           plot_height=plot_height,
                           plot_width=plot_width,
                           tools=tools,
                           title=title)
            return plot
        elif self.plot_type == "line":
            if df is None:
                source = self.filtered_data
            else:
                source = ColumnDataSource(data=df)
            source = ColumnDataSource(data=df)
            plot = line(self.x, self.y, source=source,
                        title_text_font_size="12pt",
                        plot_height=plot_height,
                        plot_width=plot_width,
                        tools=tools,
                        title=title)
            return plot
        elif self.plot_type == 'bar':
            if df is None:
                df = self.filtered_df
            if column_descriptor_dict[self.x]['type'] != 'DiscreteColumn':
                source = make_continuous_bar_source(
                    df, self.x, self.y, self.agg)
                x_range = Range1d(start=df[self.x].min() - 0.7,
                                  end=df[self.x].max() - 0.7)
                plot = make_bar_plot(source, counts_name=self.y,
                                     centers_name=self.x,
                                     plot_height=plot_height,
                                     plot_width=plot_width,
                                     tools=tools,
                                     x_range=x_range)
                return plot
            else:
                source = make_categorical_bar_source(
                    df, self.x, self.y, self.agg
                    )
                x_range = FactorRange(source[self.x])
                plot = make_bar_plot(source, counts_name=self.y,
                                     centers_name=self.x,
                                     plot_height=plot_height,
                                     plot_width=plot_width,
                                     tools=tools,
                                     x_range=x_range)
                return plot



    def plot_attribute_change(self, obj, attrname, old, new):
        setattr(self, obj.name, new)
        self.set_plot()

    def facet_change(self, obj, attrname, old, new):
        self.set_plot()

    @property
    def df(self):
        if hasattr(self, '_df'):
            return self._df
        else:
            if self.data:
                return self.data.to_df()

    @property
    def filtered_df(self):
        if hasattr(self, '_df'):
            return self._df
        else:
            if self.filtered_data:
                return self.filtered_data.to_df()

    def update(self, **kwargs):
        super(CrossFilter, self).update(**kwargs)
        self.setup_events()

    def setup_events(self):
        self.on_change('filtering_columns', self, 'setup_filter_widgets')
        for obj in self.filter_widgets.values():
            if isinstance(obj, InputWidget):
                obj.on_change('value', self, 'handle_filter_selection')
        for obj in self.filter_sources.values():
            obj.on_change('selected', self, 'handle_filter_selection')
        if self.plot_selector:
            self.plot_selector.on_change('value', self, 'plot_attribute_change')
        if self.x_selector:
            self.x_selector.on_change('value', self, 'plot_attribute_change')
        if self.y_selector:
            self.y_selector.on_change('value', self, 'plot_attribute_change')
        if self.agg_selector:
            self.agg_selector.on_change('value', self, 'plot_attribute_change')

        self.on_change('facet_x', self, 'facet_change')
        self.on_change('facet_y', self, 'facet_change')

    def handle_filter_selection(self, obj, attrname, old, new):
        column_descriptor_dict = self.column_descriptor_dict()
        df = self.df
        for descriptor in self.columns:
            colname = descriptor['name']
            if descriptor['type'] == 'DiscreteColumn' and \
               colname in self.filter_widgets:
                widget = self.filter_widgets[colname]
                selected = self.filter_widgets[colname].value
                if not selected:
                    continue
                if isinstance(selected, six.string_types):
                    df = df[colname == selected]
                else:
                    df = df[np.in1d(df[colname], selected)]
            elif descriptor['type'] in ('TimeColumn', 'ContinuousColumn') and \
                colname in self.filter_widgets:
                obj = self.filter_sources[colname]
                #hack because we don't have true range selection
                if not obj.selected:
                    continue
                min_idx = np.min(obj.selected)
                max_idx = np.max(obj.selected)

                min_val = obj.data['centers'][min_idx]
                max_val = obj.data['centers'][max_idx]
                df = df[(df[colname] >= min_val) & (df[colname] <= max_val)]
        for colname in self.data.column_names:
            self.filtered_data.data[colname] = df[colname]
            self.filtered_data._dirty = True
        self.set_plot()

    def clear_selections(self, obj, attrname, old, new):
        diff = set(old) - set(new)
        column_descriptor_dict = self.column_descriptor_dict()
        if len(diff) > 0:
            for col in diff:
                metadata = column_descriptor_dict[col]
                if metadata['type'] != 'DiscreteColumn':
                    del self.filter_sources[col]
                del self.filter_widgets[col]
        if diff:
            self.handle_filter_selection(obj, attrname, old, new)


    def setup_filter_widgets(self, obj, attrname, old, new):
        self.clear_selections(obj, attrname, old, new)
        column_descriptor_dict = self.column_descriptor_dict()
        for col in self.filtering_columns:
            metadata = column_descriptor_dict[col]
            if not col in self.filter_widgets:
                if metadata['type'] == 'DiscreteColumn':
                    select = MultiSelect.create(
                        name=col,
                        options=self.df[col].unique().tolist())
                    self.filter_widgets[col] = select
                else:
                    source = make_histogram_source(self.df[col])
                    self.filter_sources[col] = source
                    hist_plot = make_histogram(self.filter_sources[col],
                                               plot_width=150, plot_height=100,
                                               title_text_font_size='8pt',
                                               tools='select'
                    )
                    hist_plot.title = col
                    self.filter_widgets[col] = hist_plot
        curdoc().add_all()

    def set_metadata(self):
        descriptors = []
        columns = self.df.columns
        for c in columns:
            desc = self.df[c].describe()
            if self.df[c].dtype == object:
                descriptors.append({
                    'type' : "DiscreteColumn",
                    'name' : c,
                    'count' : desc['count'],
                    'unique' : desc['unique'],
                    'top' : desc['top'],
                    'freq' : desc['freq'],
                })

            elif self.df[c].dtype == np.datetime64:
                descriptors.append({
                    'type' : "TimeColumn",
                    'name' : c,
                    'count' : desc['count'],
                    'unique' : desc['unique'],
                    'first' : desc['first'],
                    'last' : desc['last'],
                })
            else:
                descriptors.append({
                    'type' : "ContinuousColumn",
                    'name' : c,
                    'count' : desc['count'],
                    'mean' : "%.2f" % desc['mean'],
                    'std' : "%.2f" % desc['std'],
                    'min' : "%.2f" % desc['min'],
                    'max' : "%.2f" % desc['max'],
                })
        self.columns = descriptors
        return None


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
    type = Enum("text", "numeric", "date", "autocomplete")
    data = String
    header = String

    # TODO: splic TableColumn into multiple classes
    source = List(String) # only 'autocomplete'
    strict = Bool(True)   # only 'autocomplete'

class HandsonTable(TableWidget):
    source = Instance(DataSource)
    columns = List(Instance(TableColumn))

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
            aggfunc = values[0]["aggregate"]
        else:
            aggfunc = len

        _, (_attrs, _rows, _cols, _values) = self._pivot_table(row_fields, column_fields, value_fields, aggfunc)

        return dict(
            attrs  = _attrs,
            rows   = _rows,
            cols   = _cols,
            values = _values,
        )
