import six
from .objects import ColumnDataSource
from .utils.plotting import (make_histogram_source, make_factor_source,
                             make_histogram)
from .plot_object import PlotObject
from .properties import (HasProps, Dict, Enum,
                         Either, Float, Instance, Int,
                         List, String, Color, Include, Bool,
                         Tuple, Any, lookup_descriptor)
from bokeh.plotting import (curdoc, cursession, line,
                            scatter)
import numpy as np
import copy
import logging
logger = logging.getLogger(__name__)

class HBox(PlotObject):
    children = List(Instance(PlotObject))
class VBox(PlotObject):
    children = List(Instance(PlotObject))

#parent class only, you need to set the fields you want
class VBoxModelForm(PlotObject):
    _children  = List(Instance(PlotObject))
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


class InputWidget(PlotObject):
    title = String()
    name = String()
    value = String()
    @classmethod
    def coerce_value(cls, val):
        prop_obj = lookup_descriptor(cls, 'value')
        if isinstance(prop_obj, Float):
            return float(val)
        if isinstance(prop_obj, Int):
            return int(val)
        if isinstance(prop_obj, String):
            return str(val)

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

class BokehApplet(PlotObject):
    modelform = Instance(VBoxModelForm)
    children = List(Instance(PlotObject))
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

class Paragraph(PlotObject):
    text = String()

class PreText(Paragraph):
    pass

class Select(InputWidget):
    options = List(Either(String(), Dict(String(), String())))
    value = String()

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
    steps = Int(default=50)
    orientation = Enum("horizontal", "vertical")
    
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
    color = String
    plot = Instance(PlotObject)
    plot_selector = Instance(Select)
    x_selector = Instance(Select)
    y_selector = Instance(Select)
    
    def __init__(self, *args, **kwargs):
        print (kwargs)
        if 'df' in kwargs:
            self._df = kwargs.pop('df')
            kwargs['data'] = ColumnDataSource(data=self.df)
            kwargs['filtered_data'] = ColumnDataSource(data=self.df)
        if 'plot_type' not in kwargs:
            kwargs['plot_type'] = "scatter"
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
            name="PlotType",
            value=self.plot_type,
            options=["line", "scatter", "bar"])
        self.plot_selector = select
        col_names = [x['name'] for x in self.columns]
        select = Select.create(
            name="x",
            value=self.x,
            options=col_names)
        self.x_selector = select
        print ('X', self.x_selector.value)
        select = Select.create(
            name="y",
            value=self.y,
            options=col_names)
        self.y_selector = select
        print ('Y', self.y_selector.value)
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
        plot = self.make_plot()
        self.plot = plot
        curdoc().add_all()

    def make_plot(self):
        if len(self.facet_x) ==0 and len(self.facet_y) == 0 and len(self.facet_tab) == 0:
            return self.make_single_plot()
        
    def make_all_facet_plot(self):
        pass
        
    def make_single_facet_plot(self):
        pass
        
    def make_xy_facet_plot(self):
        pass
        
    def make_single_plot(self):
        title ="%s by %s" % (self.x, self.y)        
        if self.plot_type == "scatter":
            plot = scatter(self.x, self.y, source=self.filtered_data, 
                          title=title)
            return plot
        elif self.plot_type == "line":
            plot = line(self.x, self.y, source=self.filtered_data, 
                          title=title)
            return plot
            
    def plot_attribute_change(self, obj, attrname, old, new):
        setattr(self, obj.name, new)
        self.set_plot()
        
    @property
    def df(self):
        if hasattr(self, '_df'):
            return self._df
        else:
            if self.data:
                return self.data.to_df()
                
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
                
                min_val = obj.data['centers'][min_idx] - obj.data['widths'][min_idx]
                max_val = obj.data['centers'][max_idx] + obj.data['widths'][max_idx]
                df = df[(df[colname] >= min_val) & (df[colname] <= max_val)]
        for colname in self.data.column_names:
            self.filtered_data.data[colname] = df[colname]
            self.filtered_data._dirty = True
        
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
                                               width=150, height=100)
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
                
                
