import numpy as np
import pandas as pd

from bokeh.objects import ColumnDataSource
from ..plotting import rect
from ..objects import Range1d
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
    bin_centers = pd.rolling_mean(bins, 2)[1:]
    #hacky - we need to center the rect around
    #height/2
    source = ColumnDataSource(data={'counts':counts,
                                    'centery' : counts /2.,
                                    'centers' : bin_centers},
                              column_names = ['counts', 'centers', 'centery']
    )
    return source

def make_continuous_bar_source(df, x_field, y_field, agg):
    labels, edges = pd.cut(df[x_field], 50, retbins=True, labels=False)
    centers = pd.rolling_mean(edges, 2)[1:]
    labels = centers[labels]
    df[x_field] = labels
    result = df.groupby(x_field)[y_field]
    result = getattr(result, agg)()
    result = result.reset_index()
    result['centery'] = result[y_field] / 2.0

    return ColumnDataSource(data=result)

def make_categorical_bar_source(df, x_field, y_field, agg):
    result = df.groupby(x_field)[y_field]
    result = getattr(result, agg)()
    result = result.reset_index()
    result['centery'] = result[y_field] / 2.0

    return ColumnDataSource(data=result)

def make_factor_source(series):
    unique_vals = np.unique(series)
    source = ColumnDataSource(data={'factors':unique_vals},
                              column_names = ['factors']
                          )
    return source

def make_bar_plot(datasource, counts_name="counts",
                  centery_name='centery',
                  centers_name="centers",
                  bar_width=0.7,
                  x_range=None,
                  plot_width=500, plot_height=500,
                  tools=None,
                  title_text_font_size="12pt"
              ):
    if tools is None:
        tools="pan,wheel_zoom,box_zoom,save,resize,select,reset"
    top = np.max(datasource.data[counts_name])
    plot = rect(centers_name, centery_name, bar_width, counts_name,
                title=" " ,
                plot_width=plot_width, plot_height=plot_height,
                tools=tools,
                title_text_font_size=title_text_font_size,
                x_range=x_range,
                y_range=Range1d(start=0, end=top),
                source=datasource,
    )
    plot.min_border = 0
    plot.border_symmetry = "none"
    select_tool = _get_select_tool(plot)
    if select_tool:
        select_tool.select_y = False
    return plot

def make_histogram(datasource, counts_name="counts",
                  centery_name='centery',
                  centers_name="centers",
                  x_range=None,
                  bar_width=0.7,
                  plot_width=500, plot_height=500,
                  min_border=40,
                  tools=None,
                  title_text_font_size="12pt"):
    top = np.max(datasource.data[counts_name])
    start = np.min(datasource.data[centers_name]) - bar_width
    end = np.max(datasource.data[centers_name]) - bar_width
    x_range = Range1d(start=start, end=end)
    plot = make_bar_plot(datasource, counts_name=counts_name,
                         centery_name=centery_name, centers_name=centers_name,
                         x_range=x_range, plot_width=plot_width, plot_height=plot_height,
                         tools=tools,
                         title_text_font_size=title_text_font_size)
    return plot


def bar_plot(datasource, counts_name="counts",
             centery_name='centery',
             centers_name="centers",
             max=None, min=None,
             plot_width=500, plot_height=500,
             min_border=40):

    if max is None:
        end = np.max(datasource.data[centers_name])
    if min is None:
        start = np.min(datasource.data[centers_name])
    top = np.max(datasource.data[counts_name])
    plot = rect(centers_name, centery_name, widths_name, counts_name,
                title=" " ,
                plot_width=plot_width, plot_height=plot_height,
                tools="select",
                title_text_font_size="8pt",
                x_range=Range1d(start=start, end=end),
                y_range=Range1d(start=0, end=top),
                source=datasource,
    )
    plot.min_border = 0
    plot.border_symmetry = "none"
    select_tool = _get_select_tool(plot)
    select_tool.select_y = False
    return plot
