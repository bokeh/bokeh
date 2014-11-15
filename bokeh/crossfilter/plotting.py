import numpy as np
import pandas as pd

from bokeh.models import ColumnDataSource
from ..objects import Range1d
from ..plotting import figure, hold, rect
from ..plotting_helpers import _get_select_tool

def cross(start, facets):
    new = [[facet] for facet in facets]
    result = []
    for x in start:
        for n in new:
            result.append(x + n)
    return result

def make_histogram_source(series):
    counts, bins = np.histogram(series, bins=50)
    centers = pd.rolling_mean(bins, 2)[1:]

    return ColumnDataSource(data={'counts': counts, 'centers': centers})

def make_continuous_bar_source(df, x_field, y_field, agg):
    labels, edges = pd.cut(df[x_field], 50, retbins=True, labels=False)
    centers = pd.rolling_mean(edges, 2)[1:]
    labels = centers[labels]
    df[x_field] = labels

    group = df.groupby(x_field)[y_field]
    aggregate = getattr(group, agg)
    result = aggregate().reset_index()

    return ColumnDataSource(data=result)

def make_categorical_bar_source(df, x_field, y_field, agg):
    group = df.groupby(x_field)[y_field]
    aggregate = getattr(group, agg)
    result = aggregate().reset_index()

    return ColumnDataSource(data=result)

def make_factor_source(series):
    return ColumnDataSource(data={'factors': p.unique(series)})

def make_bar_plot(datasource, counts_name="counts",
                  centers_name="centers",
                  bar_width=0.7,
                  x_range=None,
                  plot_width=500, plot_height=500,
                  tools="pan,wheel_zoom,box_zoom,save,resize,select,reset",
                  title_text_font_size="12pt"
              ):
    top = np.max(datasource.data[counts_name])

    figure(
      title="", title_text_font_size=title_text_font_size,
      plot_width=plot_width, plot_height=plot_height,
      x_range=x_range, y_range=[0, top], tools=tools,
    )
    hold()
    y = [val/2.0 for val in datasource.data[counts_name]]
    plot = rect(centers_name, y, bar_width, counts_name, source=datasource)

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
