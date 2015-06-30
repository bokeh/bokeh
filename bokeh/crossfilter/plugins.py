from __future__ import absolute_import

import numpy as np

from ..models import FactorRange, DataRange1d, Range1d, BoxSelectTool

from ..plotting import figure

from .plotting import make_continuous_bar_source, make_categorical_bar_source


class CrossFilterPlugin(object):
    """An adapter class between CrossFilter and custom plotting plugins.

    This adapter is used to provide a consistent interface between single
    plot generation and CrossFilter through some core behaviors. A simple
    plugin can simply override only make_plot to provide a custom plot type.

    See CrossLinePlugin for a simple example.

    Kwargs:
      crossfilter (CrossFilter): reference to the CrossFilter app
      source (ColumnDataSource): the pre-filtered source for the plot
      x_range (Range): the common x range to use for plotting
      y_range (Range): the common y range to use for plotting
      title_text_font_size (str): string of font size, e.g., "12pt"
      title_text_font_style (str): string of font style, e.g., "bold"
      plot_height (float): height of the plot in pixels
      plot_width (float): width of the plot in pixels
      tools (str): the string of tools to add to the plot
      facet (bool): whether or not we are faceting
      title (str, optional): overrides the derived title property

    """
    def __init__(self, *args, **kwargs):
        self.cf = kwargs.pop('crossfilter', None)
        self.x = self.cf.x
        self.y = self.cf.y
        self.source = kwargs.pop('source', None)
        self.facet = kwargs.pop('facet', False)
        self.col_meta = self.cf.column_descriptor_dict()
        self.valid_plot = True

        # get any provided title, else generate our own
        self._title = kwargs.pop('title', None)
        if not self._title:
            self._title = self.title
        self.args = args
        self.kwargs = kwargs

    def get_plot(self):
        """Validates, makes blank figure, then makes the plot as necessary.

        It is meant for this method to not be overridden. The methods called
        by this method should be overridden first, and this one only as a last
        resort, since it provides a common interface for plugins.

        """
        self.validate_plot()
        plot = self.make_figure(**self.kwargs)
        if self.valid_plot:
            plot = self.make_plot(plot)
        self.format_plot(plot)
        return plot

    def make_figure(self, **kwargs):
        """Generates the blank figure for the provided options.

        The purpose of this is to avoid for child plugins to have to repeat
        this functionality. It is likely to not need to override this behavior.

        """
        kwargs['title'] = self._title
        return figure(**kwargs)

    def make_plot(self, plot):
        """Plots the data into the provided plot.

        The primary method to be overridden to create a custom plugin.

        """
        plot.scatter(self.x, self.y, source=self.source)
        return plot

    def format_plot(self, plot):
        """Performs some standard formatting as required.

        Override to disable default behavior. This should contain common formatting.
        """
        # rotate labels if any are longer than some length
        if self.x_type == 'DiscreteColumn':
            lengths = [len(x) for x in set(self.source.data[self.x])]
            if max(lengths) > 3:
                plot.xaxis.major_label_orientation = np.pi / 3

    def validate_plot(self):
        """Called before plotting data to check to see if we should plot.

        If valid_plot is set to False in this method, then the figure will
        still be created, but no data will be plotted.

        """
        if self.x_type is None or self.y_type is None:
            self._title = 'Make additional column selections.'
            self.valid_plot = False
            return

        if not self.facet:
            if len(self.source.data[self.x]) == 0 or len(
                    self.source.data[self.y]) == 0:
                self._title = 'All data is filtered out.'
                self.valid_plot = False

    @property
    def title(self):
        """Generates a title for the plot, and can be overridden per plugin.

        Returns:
          str: a string to place into the title that provides additional plot info

        """
        return "%s vs. %s" % (self.y.title(), self.x.title())

    @staticmethod
    def get_col_type(metadata, col_name):
        if col_name == 'None':
            return None
        else:
            return metadata[col_name]['type']

    @property
    def x_type(self):
        return self.get_col_type(self.col_meta, self.x)

    @property
    def y_type(self):
        return self.get_col_type(self.col_meta, self.y)

    @property
    def df(self):
        return self.source.to_df()

    @staticmethod
    def make_xy_ranges(cf):
        """Generates x/y ranges specific to the plot type for the plugin.

        This method is static so that CrossFilter can generate common ranges
        to construct multiple plots from the plugin. A custom plugin would
        override this method if it has unique range types.

        Args:
          cf (CrossFilter): a reference to the CrossFilter object, used to
            get data to generate the ranges.

        Returns:
          (Range, Range): returns xrange, yrange

        """
        col_meta = cf.column_descriptor_dict()
        df = cf.df

        if cf.x != 'None' and cf.y != 'None':
            if col_meta[cf.x]['type'] == 'DiscreteColumn':
                x_range = FactorRange(factors=sorted(set(df[cf.x])))
            else:
                x_vals = df[cf.x]
                x_range = DataRange1d(start=x_vals.min(), end=x_vals.max())

            if col_meta[cf.y]['type'] == 'DiscreteColumn':
                y_range = FactorRange(factors=sorted(set(df[cf.y])))
            else:
                y_vals = df[cf.y]
                y_range = DataRange1d(start=y_vals.min(), end=y_vals.max())
        else:
            x_range, y_range = cf.x_range, cf.y_range

        return x_range, y_range


class CrossBarPlugin(CrossFilterPlugin):
    """Bar plot plugin for CrossFilter."""

    y_agg_types = ['count', 'percent']

    def __init__(self, *args, **kwargs):

        cf = kwargs['crossfilter']
        self.agg = cf.agg
        super(CrossBarPlugin, self).__init__(*args, **kwargs)
        self.bar_width = 1

        if self.y == 'None':
            self.agg_col = self.x
        else:
            self.agg_col = self.y

    def make_plot(self, plot):
        self.transform_data()

        # centers of the rectangles are half way down from the top of them
        y = [val/2.0 for val in self.source.data['heights']]

        plot.rect('labels', y, self.bar_width, 'heights', source=self.source)
        plot.h_symmetry = False
        plot.v_symmetry = False

        for tool in plot.select(type=BoxSelectTool):
            tool.dimensions = ['width']

        return plot

    def transform_data(self):
        """Generates custom source that describes the bars to be plotted.

        The x axis can either be discrete or continuous. If it is continuous,
        we must convert it to a discrete format first.
        """
        width_factor = 0.8

        if self.col_meta[self.x]['type'] != 'DiscreteColumn':
            self.source = make_continuous_bar_source(self.df, self.x, self.agg_col,
                                                     self.cf.df, self.agg)
            self.bar_width = width_factor
        else:
            self.source = make_categorical_bar_source(self.df, self.x, self.agg_col,
                                                      self.cf.df, self.agg)
            self.bar_width = width_factor

    def format_plot(self, plot):
        """Performs some standard formatting as required.

        Override to disable default behavior. This should contain common formatting.
        """
        # rotate labels
        plot.xaxis.major_label_orientation = np.pi / 3

    def validate_plot(self):
        """Catches bad configurations.

        Note: The last if statement's title will be used.
        """
        self.valid_plot, title = self.valid_selections(self.col_meta, self.x,
                                                       self.y, self.agg)
        if title is not None:
            self._title = title

        if self.df.empty:
            if not self.facet:
                self._title = 'All data is filtered out'
            self.valid_plot = False

    @staticmethod
    def valid_selections(metadata, x, y, agg_type):
        """Factors out functionality required before initialization.

        Both the initialized plugin and the xy range methods do some validity
        checking. This factors some of the common checking out so that the
        validity checking isn't repeated in both areas.
        """
        # x_type = CrossBarPlugin.get_col_type(metadata, x)
        y_type = CrossBarPlugin.get_col_type(metadata, y)
        if x == 'None':
            return False, 'Select discrete or continuous column for X.'
        elif x == y and agg_type not in CrossBarPlugin.y_agg_types:
            return False, 'X and Y must be different columns.'
        elif ((y == 'None' and agg_type not in CrossBarPlugin.y_agg_types) or
              (y_type == 'DiscreteColumn' and agg_type not in CrossBarPlugin.y_agg_types)):
            return False, ('Select continuous y column to aggregate by %s.' %
                           agg_type.title())
        else:
            return True, None

    @property
    def title(self):
        if self.y == 'None':
            return "%s (%s)" % (self.agg.title(), self.x.title())
        else:
            return "%s (%s) by %s" % (self.agg.title(), self.y.title(),
                                      self.x.title())

    @staticmethod
    def make_xy_ranges(cf, bar_width=0.7):
        """Returns ranges for a given bar width.

        Args:
          cf (CrossFilter): the CrossFilter app
          bar_width (float, optional): width of bar that affects ranges

        Returns:
          (xrange, yrange): the x/y ranges to use for the bar plot

        """
        df = cf.filtered_df
        col_meta = cf.column_descriptor_dict()

        if cf.y == 'None':
            agg_col = cf.x
        else:
            agg_col = cf.y

        # only return ranges if we have valid selections
        is_valid, _ = CrossBarPlugin.valid_selections(col_meta, cf.x, agg_col,
                                                      cf.agg)
        if is_valid:

            # create x range
            if col_meta[cf.x]['type'] != 'DiscreteColumn':
                source = make_continuous_bar_source(df, cf.x, agg_col, cf.df, cf.agg)
            else:
                source = make_categorical_bar_source(df, cf.x, agg_col, cf.df, cf.agg)
            x_range = FactorRange(factors=source.data['labels'])

            # create y range
            if cf.agg == 'percent':
                top = 100
            else:
                top = np.max(source.data['heights']) * 1.05
            y_range = Range1d(start=0, end=top)
            return x_range, y_range
        else:
            return cf.x_range, cf.y_range


class CrossScatterPlugin(CrossFilterPlugin):
    """Scatter plot plugin for CrossFilter."""

    def __init__(self, *args, **kwargs):
        super(CrossScatterPlugin, self).__init__(*args, **kwargs)


class CrossLinePlugin(CrossFilterPlugin):
    """Line plot plugin for CrossFilter."""

    def __init__(self, *args, **kwargs):
        super(CrossLinePlugin, self).__init__(*args, **kwargs)

    def make_plot(self, plot):
        plot.line(self.x, self.y, source=self.source)
        return plot
