import logging

import six
import pandas as pd
import numpy as np

from ..plotting import curdoc
from ..models import ColumnDataSource, Range1d, FactorRange, GridPlot
from ..models.widgets import Select, MultiSelect, InputWidget
# crossfilter plotting utilities
from .plotting import (make_histogram_source,
                       make_histogram, make_continuous_bar_source,
                       make_categorical_bar_source,
                       make_bar_plot, cross)
#bokeh plotting functions
from ..plotting import figure
from ..plot_object import PlotObject
from ..properties import Dict, Enum, Instance, List, String, Any, Int

logger = logging.getLogger(__name__)


class DiscreteFacet(object):
    """Pairing of a field and a unique value, representing a subset of the
    total data."""

    def __init__(self, field, value, label=None):
        """Sets object properties and creates label if not provided.

        Args:
          field (str): name of the column
          value: unique value defined for the column
          label (str, optional): string representation of the value

        """
        if label is None:
            label = str(value)
        self.field = field
        self.label = label
        self._value = value

    def __repr__(self):
        return "%s:%s"%(self.field, self.label)

    def filter(self, df):
        """Filters the provided DataFrame to the subset corresponding to value.

        Args:
          df (DataFrame): contains a column of ``field``

        Returns:
          DataFrame: filtered to rows, where column ``field`` has values
            equal to ``_value``.

        """
        return df[df[self.field] == self._value]


class ContinuousFacet(DiscreteFacet):
    """Represents a range of values for a field in a DataFrame."""

    def __init__(self, field, value, bins, label=None):
        """Calls parent ``DiscreteFacet`` and stores bins for later filtering.

        Args:
          field (str): name of the column
          value (str): center of range of values in the column
          bins (list[float]): start and inclusive stop value for the bin
          label (str, optional): string representation

        """
        super(ContinuousFacet, self).__init__(field, value, label=label)
        self.bins = bins

    def filter(self, df):
        """Filters the provided DataFrame to the subset corresponding to bins.

        Args:
          df (DataFrame): contains a column of ``field``

        Returns:
          DataFrame: filtered to rows, where column ``field`` has values
            within the bounds of ``bins``.

        """
        if self.bins[0] is not None:
            df = df[df[self.field] > self.bins[0]]
        if self.bins[1] is not None:
            df = df[df[self.field] <= self.bins[1]]
        return df


class CrossFilter(PlotObject):
    """Interactive filtering and faceting application with multiple plot
    types"""

    # identify properties for the data
    columns = List(Dict(String, Any))
    data = Instance(ColumnDataSource)
    filtered_data = Instance(ColumnDataSource)

    # list of datasources to use for filtering widgets
    filter_sources = Dict(String, Instance(ColumnDataSource))

    # list of columns we are filtering
    filtering_columns = List(String)

    # dict of column name to filtering widgets
    filter_widgets = Dict(String, Instance(PlotObject))

    # dict which aggregates all the selections from the different filtering
    # widgets
    filtered_selections = Dict(String, Dict(String, Any))

    # list of facet vars
    facet_x = List(String, default=[])
    facet_y = List(String, default=[])
    facet_tab = List(String, default=[])

    # the displayed plot object
    plot = Instance(PlotObject)

    # configuration properties for the plot
    plot_type = Enum("line", "scatter", "bar")
    x = String
    y = String
    agg = String
    color = String
    height = Int()
    width = Int()

    # identify the selector/drop-down properties
    plot_selector = Instance(Select)
    x_selector = Instance(Select)
    y_selector = Instance(Select)
    agg_selector = Instance(Select)

    def __init__(self, *args, **kwargs):
        """Creates original and filtered ColumnDataSource and handles defaults.

        The df and starting configuration are only provided the first time
        init is called, within the create method.

        Kwargs:
          df (DataFrame): the data to use in the crossfilter app
          plot_type (str, optional): starting plot type
          agg (str, optional): starting aggregation type

        """
        if 'df' in kwargs:
            self._df = kwargs.pop('df')
            kwargs['data'] = ColumnDataSource(data=self.df)
            kwargs['filtered_data'] = ColumnDataSource(data=self.df)

        # default plot type
        if 'plot_type' not in kwargs:
            kwargs['plot_type'] = "scatter"

        # default aggregation type
        if 'agg' not in kwargs:
            kwargs['agg'] = 'sum'

        super(CrossFilter, self).__init__(**kwargs)

    @classmethod
    def create(cls, **kwargs):
        """Performs all one-time construction of bokeh objects.

        This classmethod is required due to the way that bokeh handles the
        python and javascript components. The initialize method will be
        called each additional time the app is updated (including once in
        the create method), but the PlotObject infrastructure will find that
        the object already exists in any future calls, and will not create a
        new object.

        Kwargs:
          df (DataFrame): the data to use in the crossfilter app
          plot_type (str, optional): starting plot type
          agg (str, optional): starting aggregation type

        :return:
        """
        obj = cls(**kwargs)
        obj.set_metadata()
        choices = obj.make_plot_choices()
        obj.update_plot_choices(choices)
        obj.set_plot()
        obj.set_input_selector()
        return obj

    def set_input_selector(self):
        """Creates and configures each selector (drop-down menu)."""

        col_names = [x['name'] for x in self.columns]

        self.plot_selector = Select.create(
            title="PlotType",
            name="plot_type",
            value=self.plot_type,
            options=["line", "scatter", "bar"],
        )

        self.x_selector = Select.create(
            name="x",
            value=self.x,
            options=col_names,
        )

        self.y_selector = Select.create(
            name="y",
            value=self.y,
            options=col_names,
        )

        self.agg_selector = Select.create(
            name='agg',
            value=self.agg,
            options=['sum', 'mean', 'last'],
        )

    def update_plot_choices(self, input_dict):
        """Sets object attributes corresponding to input_dict's values.

        Args:
          input_dict (dict): dict with x, y, and plot_type keys

        """
        for k, v in input_dict.items():
            if getattr(self, k) is None:
                setattr(self, k, v)

    def column_descriptor_dict(self):
        """Creates column stats dict with keys of column names.

        Returns:
          dict: dict with key per column in data, where values are column stats

        """
        column_descriptors = {}
        for x in self.columns:
            column_descriptors[x['name']] = x
        return column_descriptors

    def continuous_columns(self):
        """Returns list of column descriptors for the non-Discrete columns.

        Returns:
          list(dict): list of dicts, containing metadata about columns

        """
        return [x for x in self.columns if x['type'] != 'DiscreteColumn']

    def discrete_columns(self):
        """Returns list of column descriptors for the Discrete columns.

        Returns:
          list(dict): list of dicts, containing metadata about columns

        """
        return [x for x in self.columns if x['type'] == 'DiscreteColumn']

    def make_plot_choices(self):
        """Selects first two continuous columns for x,y during initial setup

        Returns:
          dict: x, y, and plot_type keys and values for initial setup

        """
        x, y = [x['name'] for x in self.continuous_columns()[:2]]
        return {'x': x, 'y': y, 'plot_type': 'scatter'}

    def set_plot(self):
        """Makes and sets the plot based on the current configuration of app."""

        # ToDo: better handle where x and y columns are the same
        if self.x == self.y:
            return

        plot = self.make_plot()
        self.plot = plot
        curdoc()._add_all()

    def make_plot(self):
        """Makes the correct plot layout type, based on app's current config."""
        # ToDo: why is there x specific faceting, but no y?

        # no faceting
        if all([len(self.facet_x) == 0,
                len(self.facet_y) == 0,
                len(self.facet_tab) == 0]):
            return self.make_single_plot()

        # x faceting
        if all([len(self.facet_x) != 0,
                len(self.facet_y) == 0,
                len(self.facet_tab) == 0]):
            return self.make_all_facet_plot()

        # x and y faceting
        if all([len(self.facet_x) != 0,
                len(self.facet_y) != 0,
                len(self.facet_tab) == 0]):
            return self.make_xy_facet_plot()

    def make_facets(self, dimension):
        """Creates combination of all facets for the provided dimension

        Args:
          dimension (str): name of the dimension to create facets for

        Returns:
          list(list(DiscreteFacet or ContinuousFacet)): list of list of
            unique facet combinations

        """
        if dimension == 'x':
            facets = self.facet_x
        else:
            facets = self.facet_y

        # create facets for each column
        column_descriptor_dict = self.column_descriptor_dict()
        all_facets = [[]]
        for field in facets:

            # create facets from discrete columns
            if column_descriptor_dict[field]['type'] == 'DiscreteColumn':
                field_facets = [DiscreteFacet(field, val) for val in
                          np.unique(self.df[field].values)]

                # combine any facets as required
                all_facets = cross(all_facets, field_facets)
            else:
                # create quantile based discrete data and pairs of bins
                categorical, bins = pd.qcut(self.df[field], 4, retbins=True)
                cats = categorical.cat.categories
                bins = [[bins[idx], bins[idx + 1]] for idx in range(len(bins)- 1)]
                bins[0][0] = None

                # create list of facets
                field_facets = [ContinuousFacet(field, value, bin) for
                                bin, value in zip(bins, cats)]

                # combine any facets as required
                all_facets = cross(all_facets, field_facets)

        return all_facets

    @staticmethod
    def facet_title(facets):
        """Joins list of facets by commas.

        Args:
          facets (list(DiscreteFacet or ContinuousFacet)): list of facets,
          which are a combination of column and unique value within it

        Returns:
          str: string representation of the combination of facets

        """
        title = ",".join([str(x) for x in facets])
        return title

    def facet_data(self, facets, df=None):
        """Filters data to the rows associated with the given facet.

        Args:
          facets (list(DiscreteFacet or ContinuousFacet)): list of facets,
          which are a combination of column and unique value within it
          df (DataFrame, optional): data to be filtered on

        Returns:
          DataFrame: filtered DataFrame based on provided facets

        """
        if df is None:
            df = self.filtered_df
        for f in facets:
            df = f.filter(df)
        return df

    def make_all_facet_plot(self):
        """Creates the faceted plots when a facet is added to the x axis.

        Returns:
          GridPlot: a grid of plots, where each plot has subset of data

        """
        all_facets = self.make_facets('x')
        plots = []

        # loop over facets and create single plots for data subset
        for facets in all_facets:
            title = self.facet_title(facets)
            df = self.facet_data(facets, self.filtered_df)
            plot = self.make_single_plot(
                df=df, title=title, plot_height=200, plot_width=200,
                tools="pan,wheel_zoom"
            )
            plot.min_border = 0

            # append single plot to list of plots
            plots.append(plot)

        # create squarish grid based on number of plots
        chunk_size = int(np.ceil(np.sqrt(len(plots))))

        # create list of lists of plots, where each list of plots is a row
        grid_plots = []
        for i in range(0, len(plots), chunk_size):
            chunk = plots[i:i + chunk_size]
            grid_plots.append(chunk)

        # return the grid as the plot
        grid = GridPlot(children=grid_plots, plot_width=200*chunk_size)
        return grid

    def make_xy_facet_plot(self):
        """Creates the grid of plots when there are both x and y facets.

        Returns:
          GridPlot: grid of x and y facet combinations

        """

        # ToDo: gracefully handle large combinations of facets
        all_facets_x = self.make_facets('x')
        all_facets_y = self.make_facets('y')
        grid_plots = []

        # y faceting down column
        for facets_y in all_facets_y:

            # x faceting across row
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
                plot.v_symmetry = False
                plot.h_symmetry = False
                row.append(plot)

            # append the row to the list of rows
            grid_plots.append(row)

        # return the grid of plots as the plot
        grid = GridPlot(children=grid_plots, plot_width=200*len(all_facets_x))
        return grid

    def make_single_plot(self, df=None, title=None,
                         plot_width=700, plot_height=680,
                         tools="pan,wheel_zoom,box_zoom,save,resize,"
                               "box_select,reset"):
        """Creates a plot based on the current app configuration.

        Args:
          df (DataFrame, optional): data to use for the plot
          title (str, optional): plot title
          plot_width (float, optional): width of plot in pixels
          plot_height (float, optional): height of plot in pixels
          tools (str, optional): comma separated string of tool names

        Returns:
          PlotObject: the generated plot

        """
        column_descriptor_dict = self.column_descriptor_dict()


        if df is None:
            source = self.filtered_data
        else:
            source = ColumnDataSource(data=df)

        # scatter plot
        if self.plot_type == "scatter":
            if title is None:
                title = "%s by %s"%(self.x, self.y)

            plot = figure(title_text_font_size="12pt",
                          plot_height=plot_height,
                          plot_width=plot_width,
                          tools=tools,
                          title=title)
            plot.scatter(self.x, self.y, source=source)
            return plot

        # line plot
        elif self.plot_type == "line":
            if title is None:
                title = "%s by %s"%(self.x, self.y)

            plot = figure(title_text_font_size="12pt",
                          plot_height=plot_height,
                          plot_width=plot_width,
                          tools=tools,
                          title=title)
            plot.line(self.x, self.y, source=source)
            return plot

        # bar plot
        elif self.plot_type == 'bar':

            if title is None:
                title = "%s(%s) by %s"%(self.agg, self.y, self.x)

            if df is None:
                df = self.filtered_df

            if not df.empty:
                # discrete data on x axis
                if column_descriptor_dict[self.x]['type'] != 'DiscreteColumn':
                    source = make_continuous_bar_source(
                        df, self.x, self.y, self.agg)
                    bar_width = 0.7
                    x_range = [df[self.x].min() - bar_width,
                               df[self.x].max() - bar_width]

                # continuous/other data on x axis
                else:
                    source = make_categorical_bar_source(df, self.x, self.y,
                                                         self.agg)
                    x_range = FactorRange(source.data[self.x])

                plot = make_bar_plot(source, counts_name=self.y,
                                     centers_name=self.x,
                                     plot_height=plot_height,
                                     plot_width=plot_width,
                                     tools=tools,
                                     x_range=x_range)
                plot.title = title

            # handle if we have filtered out everything for this faceted plot
            else:
                plot = figure(title_text_font_size="12pt",
                              plot_height=plot_height,
                              plot_width=plot_width,
                              tools=tools,
                              title=title)

            return plot

        # the plot requested is not known
        else:
            raise NotImplementedError("The chosen plot is not defined")

    def plot_attribute_change(self, obj, attrname, old, new):
        """Updates app's attribute and plot when view configuration changes.

        Args:
          obj (Widget): the object that has an attribute change
          attrname (str): name of the attribute
          old (type): the previous value of unknown type
          new (type): the new value of unknown type

        """
        # ToDo: why pass attribute name? 'value' is passed instead of 'name'
        setattr(self, obj.name, new)
        self.set_plot()

    def facet_change(self, obj, attrname, old, new):
        """Updates plot when any facet configuration changes.

        Args:
          obj (Widget): the object that has an attribute change
          attrname (str): name of the attribute
          old (type): the previous value of unknown type
          new (type): the new value of unknown type

        """
        self.set_plot()

    @property
    def df(self):
        """The core data that is used by the app for plotting.

        Returns:
          DataFrame: the original data structure

        """
        if hasattr(self, '_df'):
            return self._df
        else:
            if self.data:
                return self.data.to_df()

    @property
    def filtered_df(self):
        """The subset of the data to use for plotting.

        Returns:
          DataFrame: the original data structure

        """
        # ToDo: shouldn't this just return self.df if there are no filters
        if hasattr(self, '_df'):
            return self._df
        else:
            if self.filtered_data:
                return self.filtered_data.to_df()

    def update(self, **kwargs):
        # ToDo: determine when this is called
        super(CrossFilter, self).update(**kwargs)
        self.setup_events()

    def setup_events(self):
        """Registers events each time the app changes state."""
        # ToDo: do we need to re-register events for everything this often

        # watch the app's filtering_columns attribute to setup filters
        self.on_change('filtering_columns', self, 'setup_filter_widgets')

        # register any available filter widget
        for obj in self.filter_widgets.values():
            if isinstance(obj, InputWidget):
                obj.on_change('value', self, 'handle_filter_selection')

        # watch app column data source attribute for changes
        for obj in self.filter_sources.values():
            obj.on_change('selected', self, 'handle_filter_selection')

        # selector event registration
        if self.plot_selector:
            self.plot_selector.on_change('value', self, 'plot_attribute_change')
        if self.x_selector:
            self.x_selector.on_change('value', self, 'plot_attribute_change')
        if self.y_selector:
            self.y_selector.on_change('value', self, 'plot_attribute_change')
        if self.agg_selector:
            self.agg_selector.on_change('value', self, 'plot_attribute_change')

        # register to watch the app's facet attributes
        self.on_change('facet_x', self, 'facet_change')
        self.on_change('facet_y', self, 'facet_change')

    def handle_filter_selection(self, obj, attrname, old, new):
        """Filters the data source whenever a filter widget changes.

        Args:
          obj (Widget): the object that has an attribute change
          attrname (str): name of the attribute
          old (type): the previous value of unknown type
          new (type): the new value of unknown type

        """
        df = self.df

        # loop over the column metadata
        for descriptor in self.columns:
            colname = descriptor['name']

            # handle discrete selections
            if descriptor['type'] == 'DiscreteColumn' and \
                            colname in self.filter_widgets:
                selected = self.filter_widgets[colname].value
                if not selected:
                    continue
                if isinstance(selected, six.string_types):
                    df = df[colname == selected]
                else:
                    df = df[np.in1d(df[colname], selected)]

            # handle time or continuous selections
            elif descriptor['type'] in ('TimeColumn', 'ContinuousColumn') and \
                            colname in self.filter_widgets:
                obj = self.filter_sources[colname]

                # hack because we don't have true range selection
                if not obj.selected:
                    continue
                min_idx = np.min(obj.selected)
                max_idx = np.max(obj.selected)

                min_val = obj.data['centers'][min_idx]
                max_val = obj.data['centers'][max_idx]
                df = df[(df[colname] >= min_val) & (df[colname] <= max_val)]

        # update filtered data and force plot update
        for colname in self.data.column_names:
            self.filtered_data.data[colname] = df[colname]
            self.filtered_data._dirty = True
        self.set_plot()

    def clear_selections(self, obj, attrname, old, new):
        """Updates filter widgets and sources as they are removed.

        Args:
          obj (Widget): the object that has an attribute change
          attrname (str): name of the attribute
          old (type): the previous value of unknown type
          new (type): the new value of unknown type

        """
        diff = set(old) - set(new)
        column_descriptor_dict = self.column_descriptor_dict()

        # delete any removed filter widgets
        if len(diff) > 0:
            for col in diff:
                metadata = column_descriptor_dict[col]
                if metadata['type'] != 'DiscreteColumn':
                    del self.filter_sources[col]
                del self.filter_widgets[col]

        # update the data based on latest changes
        if diff:
            self.handle_filter_selection(obj, attrname, old, new)


    def setup_filter_widgets(self, obj, attrname, old, new):
        """Creates new filter widget each time a new column is added to filters.

        Args:
          obj (Widget): the object that has an attribute change
          attrname (str): name of the attribute
          old (type): the previous value of unknown type
          new (type): the new value of unknown type

        """
        self.clear_selections(obj, attrname, old, new)

        # add new widget as required for each column set to filter on
        column_descriptor_dict = self.column_descriptor_dict()
        for col in self.filtering_columns:

            metadata = column_descriptor_dict[col]
            if not col in self.filter_widgets:

                # discrete
                if metadata['type'] == 'DiscreteColumn':
                    select = MultiSelect.create(
                        name=col,
                        options=self.df[col].unique().tolist())
                    self.filter_widgets[col] = select

                # continuous
                else:
                    source = make_histogram_source(self.df[col])
                    self.filter_sources[col] = source
                    hist_plot = make_histogram(self.filter_sources[col],
                                               plot_width=200, plot_height=100,
                                               title_text_font_size='8pt',
                                               tools='box_select'
                    )
                    hist_plot.title = col
                    self.filter_widgets[col] = hist_plot

        curdoc()._add_all()

    def set_metadata(self):
        """Creates a list of dicts, containing summary info for each column.

        The descriptions are stored in the ``columns`` property.

        """
        descriptors = []

        columns = self.df.columns
        for c in columns:

            # get description for column from pandas DataFrame
            desc = self.df[c].describe()

            # DiscreteColumn
            if self.df[c].dtype == object:
                descriptors.append({
                    'type': "DiscreteColumn",
                    'name': c,
                    'count': desc['count'],
                    'unique': desc['unique'],
                    'top': desc['top'],
                    'freq': desc['freq'],
                })

            # TimeColumn
            elif self.df[c].dtype == np.datetime64:
                descriptors.append({
                    'type': "TimeColumn",
                    'name': c,
                    'count': desc['count'],
                    'unique': desc['unique'],
                    'first': desc['first'],
                    'last': desc['last'],
                })

            # ContinuousColumn
            else:
                descriptors.append({
                    'type': "ContinuousColumn",
                    'name': c,
                    'count': desc['count'],
                    'mean': "%.2f"%desc['mean'],
                    'std': "%.2f"%desc['std'],
                    'min': "%.2f"%desc['min'],
                    'max': "%.2f"%desc['max'],
                })

        self.columns = descriptors
