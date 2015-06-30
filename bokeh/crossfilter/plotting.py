from __future__ import absolute_import

import numpy as np
import pandas as pd

from bokeh.models import ColumnDataSource, BoxSelectTool
from ..plotting import figure

def cross(start, facets):
    """Creates a unique combination of provided facets.
    A cross product of an initial set of starting facets with a new set of
    facets.

    Args:
      start (list): List of lists of facets
      facets (list): List of facets

    Returns:
      list: a list of lists of unique combinations of facets

    """
    new = [[facet] for facet in facets]
    result = []
    for x in start:
        for n in new:
            result.append(x + n)
    return result


def hide_axes(plot, axes=('x', 'y')):
    """Hides the axes of the plot by setting component alphas.

    Args:
      plot (Figure): a valid figure with x and y axes
      axes (tuple or list or str, optional): the axes to hide the axis on.

    """
    if isinstance(axes, str):
        axes = tuple(axes)

    for label in axes:
        axis = getattr(plot, label + 'axis')
        axis = axis[0]
        axis.major_label_text_alpha = 0.0
        axis.major_label_text_font_size = '0pt'
        axis.axis_line_alpha = 0.0
        axis.major_tick_line_alpha = 0.0
        axis.minor_tick_line_alpha = 0.0

    plot.min_border = 0


def make_histogram_source(series):
    """Creates a ColumnDataSource containing the bins of the input series.

    Args:
      series (:py:class:`~pandas.Series`): description

    Returns:
      ColumnDataSource: includes bin centers with count of items in the bins

    """
    counts, bins = np.histogram(series, bins=50)
    centers = pd.rolling_mean(bins, 2)[1:]

    return ColumnDataSource(data={'counts': counts, 'centers': centers})


def make_continuous_bar_source(df, x_field, y_field='None', df_orig=None, agg='count'):
    """Makes discrete, then creates representation of the bars to be plotted.

    Args:
      df (DataFrame): contains the data to be converted to a discrete form
      x_field (str): the column in df that maps to the x dim of the plot
      y_field (str, optional):  the column in df that maps to the y dim of the plot
      df_orig (DataFrame, optional): original dataframe that the subset ``df`` was
        generated from
      agg (str, optional): the type of aggregation to be used

    Returns:
      ColumnDataSource: aggregated, discrete form of x,y values

    """
    # Generate dataframe required to use the categorical bar source function
    idx, edges = pd.cut(x=df[x_field], bins=8, retbins=True, labels=False)
    labels, edges = pd.cut(x=df[x_field], bins=8, retbins=True)
    centers = pd.rolling_mean(edges, 2)[1:]

    # store new value of x as the bin it fell into
    df['centers'] = centers[idx]
    df['labels'] = labels

    # After making it discrete, create the categorical bar source
    return make_categorical_bar_source(df, 'labels', y_field, df_orig, agg)


def make_categorical_bar_source(df, x_field, y_field='None', df_orig=None, agg='count'):
    """Creates representation of the bars to be plotted.

    Args:
      df (DataFrame): contains the data to be converted to a discrete form
      x_field (str): the column in df that maps to the x dim of the plot
      y_field (str, optional):  the column in df that maps to the y dim of the plot
      df_orig (DataFrame, optional): original dataframe that the subset ``df`` was
        generated from
      agg (str, optional): the type of aggregation to be used

    Returns:
      ColumnDataSource: aggregated, discrete form of x,y values

    """
    if df_orig is None:
        df_orig = df

    # handle x-only aggregations separately
    if agg == 'percent' or agg == 'count':
        # percent aggregations are a special case, since pandas doesn't directly support
        if agg == 'percent':

            # percent on discrete col using proportion, on continuous using percent
            if df[y_field].dtype == 'object':
                agg_func = 'count'
            else:
                agg_func = 'sum'

            total = float(getattr(df_orig[y_field], agg_func)())
            series = df.groupby(x_field)[y_field].apply(lambda x, total_agg=total, f=agg_func:
                                                        100*(getattr(x, f)()/total_agg))
        elif agg == 'count':
            series = df.groupby(x_field).size()
        else:
            raise ValueError('Unrecognized Aggregation Type for Y of "None"')

        # here we have a series where the values are the aggregation for the index (bars)
        result = pd.DataFrame(data={'labels': series.index, 'heights': series.values})

    # x and y aggregations
    else:
        # Get the y values after grouping by the x values
        group = df.groupby(x_field)[y_field]
        aggregate = getattr(group, agg)
        result = aggregate().reset_index()
        result.rename(columns={x_field: 'labels', y_field: 'heights'}, inplace=True)

    return ColumnDataSource(data=result)


def make_factor_source(series):
    """Generate data source that is based on the unique values in the series.

    Args:
      series (:py:class:`~pandas.Series`): contains categorical-like data

    Returns:
      ColumnDataSource: contains the unique values from the series

    """
    return ColumnDataSource(data={'factors': series.unique()})


def make_bar_plot(datasource, counts_name="counts",
                  centers_name="centers",
                  bar_width=0.7,
                  x_range=None,
                  y_range=None,
                  plot_width=500, plot_height=500,
                  tools="pan,wheel_zoom,box_zoom,save,resize,box_select,reset",
                  title_text_font_size="12pt"):
    """Utility function to set/calculate default parameters of a bar plot.

    Args:
      datasource (ColumnDataSource): represents bars to plot
      counts_name (str): column corresponding to height of the bars
      centers_name (str): column corresponding to the location of the bars
      bar_width (float): the width of the bars in the bar plot
      x_range (list): list of two values, the min and max of the x axis range
      plot_width (float): width of the plot in pixels
      plot_height (float): height of the plot in pixels
      tools (str): comma separated tool names to add to the plot
      title_text_font_size (str): size of the plot title, e.g., '12pt'

    Returns:
      figure: plot generated from the provided parameters

    """
    top = np.max(datasource.data[counts_name])

    # Create the figure container
    plot = figure(
        title="", title_text_font_size=title_text_font_size,
        plot_width=plot_width, plot_height=plot_height,
        x_range=x_range, y_range=[0, top], tools=tools)

    # Get the bar values
    y = [val/2.0 for val in datasource.data[counts_name]]

    # Generate the bars in the figure
    plot.rect(centers_name, y, bar_width, counts_name, source=datasource)

    plot.min_border = 0
    plot.h_symmetry = False
    plot.v_symmetry = False

    for tool in plot.select(type=BoxSelectTool):
        tool.dimensions = ['width']

    return plot


def make_histogram(datasource,
                   counts_name="counts",
                   centers_name="centers",
                   x_range=None,
                   bar_width=0.7,
                   plot_width=500,
                   plot_height=500,
                   min_border=40,
                   tools=None,
                   title_text_font_size="12pt"):
    """Utility function to create a histogram figure.

    This is used to create the filter widgets for continuous data in
    CrossFilter.

    Args:
      datasource (ColumnDataSource): represents bars to plot
      counts_name (str): column corresponding to height of the bars
      centers_name (str): column corresponding to the location of the bars
      x_range (list): list of two values, the min and max of the x axis range
      bar_width (float): the width of the bars in the bar plot
      plot_width (float): width of the plot in pixels
      plot_height (float): height of the plot in pixels
      min_border (float): minimum border width of figure in pixels
      tools (str): comma separated tool names to add to the plot
      title_text_font_size (str): size of the plot title, e.g., '12pt'

    Returns:
      figure: histogram plot generated from the provided parameters

    """
    start = np.min(datasource.data[centers_name]) - bar_width
    end = np.max(datasource.data[centers_name]) - bar_width
    plot = make_bar_plot(
        datasource, counts_name=counts_name, centers_name=centers_name,
        x_range=[start, end], plot_width=plot_width, plot_height=plot_height,
        tools=tools, title_text_font_size=title_text_font_size)
    return plot
