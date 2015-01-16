import numpy as np
import pandas as pd

from bokeh.models import ColumnDataSource
from ..plotting import figure
from ..plotting_helpers import _get_select_tool


def cross(start, facets):
    """
    A cross product of an initial set of starting facets with a new set of facets, producing a unique combination of
    all types of facets.

    :param start: List of lists of facets
    :param facets: List of facets
    :return: list of lists of combination of facets
    """
    new = [[facet] for facet in facets]
    result = []
    for x in start:
        for n in new:
            result.append(x + n)
    return result


def make_histogram_source(series):
    """
    Converts a continuous series of data into a ColumnDataSource that represents the bins of the series.

    :param series: pandas series of continuous data
    :return: ColumnDataSource with the centers of the histogram bins, corresponding to the count of items in the
    associated bin.
    """
    counts, bins = np.histogram(series, bins=50)
    centers = pd.rolling_mean(bins, 2)[1:]

    return ColumnDataSource(data={'counts': counts, 'centers': centers})


def make_continuous_bar_source(df, x_field, y_field, agg):
    """
    Creates a new data source that represents the bars to be plotted after converting continuous data to discrete.

    :param df: pandas DataFrame
    :param x_field: the column in df that maps to the x dimension of the plot, as a string
    :param y_field: the column in the df that maps to the y dimension of the plot, as a string
    :param agg: the type aggregation to be used, as a string
    :return: ColumnDataSource based on the df columns, but aggregated based on the type requested
    """

    # Generate dataframe required to use the categorical bar source function
    labels, edges = pd.cut(df[x_field], 50, retbins=True, labels=False)
    centers = pd.rolling_mean(edges, 2)[1:]
    labels = centers[labels]
    df[x_field] = labels

    return make_categorical_bar_source(df, x_field, y_field, agg)


def make_categorical_bar_source(df, x_field, y_field, agg):
    """
    Creates a new data source that represents the bars to be plotted.
    This is based on the existing configuration for the data structure being plotted, name of the columns that maps to
    the x and y fields, and the type of aggregation that is currently configured. The type of aggregation is what
    determines the values of the bars.

    :param df: pandas DataFrame
    :param x_field: the column in df that maps to the x dimension of the plot, as a string
    :param y_field: the column in the df that maps to the y dimension of the plot, as a string
    :param agg: the type aggregation to be used, as a string
    :return: ColumnDataSource based on the df columns, but aggregated based on the type requested
    """

    # Get the y values after grouping by the x values
    group = df.groupby(x_field)[y_field]
    aggregate = getattr(group, agg)

    # Convert back to a DataFrame on the aggregated data
    result = aggregate().reset_index()

    return ColumnDataSource(data=result)


def make_factor_source(series):
    """
    Generate data source that is based on the unique values in the series.

    :param series: pandas series object
    :return: ColumnDataSource with unique values of the series
    """
    return ColumnDataSource(data={'factors': series.unique()})


def make_bar_plot(datasource, counts_name="counts",
                  centers_name="centers",
                  bar_width=0.7,
                  x_range=None,
                  plot_width=500, plot_height=500,
                  tools="pan,wheel_zoom,box_zoom,save,resize,box_select,reset",
                  title_text_font_size="12pt"):
    """
    Utility function to set/calculate default parameters of a bar plot for the datasource.

    :param datasource: ColumnDataSource of the data to plot
    :param counts_name: the column in datasource that corresponds to height of the bars
    :param centers_name: the column in the datasource that corresponds to the location of the bars
    :param bar_width: the width of the bars in the bar plot as a float/int
    :param x_range: list of two values, the min and max of the x axis range
    :param plot_width: value for the width of the plot in pixels
    :param plot_height: value for the height of the plot in pixels
    :param tools: string of comma separated tool names to add to the plot
    :param title_text_font_size: string of size of the plot title, e.g., '12pt'
    :return: Figure generated from the provided parameters
    """

    top = np.max(datasource.data[counts_name])

    plot = figure(
        title="", title_text_font_size=title_text_font_size,
        plot_width=plot_width, plot_height=plot_height,
        x_range=x_range, y_range=[0, top], tools=tools)

    y = [val/2.0 for val in datasource.data[counts_name]]
    plot.rect(centers_name, y, bar_width, counts_name, source=datasource)

    plot.min_border = 0
    plot.h_symmetry = False
    plot.v_symmetry = False

    select_tool = _get_select_tool(plot)
    if select_tool:
        select_tool.dimensions = ['width']

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

    start = np.min(datasource.data[centers_name]) - bar_width
    end = np.max(datasource.data[centers_name]) - bar_width
    plot = make_bar_plot(
        datasource, counts_name=counts_name, centers_name=centers_name,
        x_range=[start, end], plot_width=plot_width, plot_height=plot_height,
        tools=tools, title_text_font_size=title_text_font_size)
    return plot
