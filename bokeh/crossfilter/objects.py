import copy
import logging

import six
import pandas as pd
import numpy as np

from ..objects import ColumnDataSource, Range1d, FactorRange, GridPlot, Widget, DataSource
from ..widgetobjects import Select, MultiSelect, InputWidget
#crossfilter plotting utilities
from .plotting import (make_histogram_source, make_factor_source,
                       make_histogram, make_continuous_bar_source,
                       make_categorical_bar_source,
                       make_bar_plot, cross)
#bokeh plotting functions
from ..plotting import (curdoc, cursession, line,
                            scatter)
from ..plot_object import PlotObject
from ..properties import (HasProps, Dict, Enum, Either, Float, Instance, Int, List,
    String, Color, Include, Bool, Tuple, Any, Date, RelativeDelta, lookup_descriptor)

logger = logging.getLogger(__name__)

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
        for k,v in input_dict.items():
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
        if all([len(self.facet_x) ==0,
                len(self.facet_y) == 0,
                len(self.facet_tab) == 0]):
            return self.make_single_plot()

        if all([len(self.facet_x) !=0,
                len(self.facet_y) == 0,
                len(self.facet_tab) == 0]):
            return self.make_all_facet_plot()

        if all([len(self.facet_x) !=0,
                len(self.facet_y) != 0,
                len(self.facet_tab) == 0]):
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
                bar_width = 0.7
                x_range = Range1d(start=df[self.x].min() - bar_width,
                                  end=df[self.x].max() - bar_width)
                plot = make_bar_plot(source, counts_name=self.y,
                                     centers_name=self.x,
                                     bar_width=bar_width,
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
