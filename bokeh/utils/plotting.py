from bokeh.objects import ColumnDataSource
import numpy as np
import pandas as pd
from ..plotting import rect
from ..objects import Range1d
from ..plotting_helpers import _get_select_tool
def make_histogram_source(series):
    counts, bins = np.histogram(series, bins=50)
    bin_centers = pd.rolling_mean(bins, 2)[1:]
    bin_widths = np.diff(bins)
    
    #hacky - we need to center the rect around
    #height/2
    source = ColumnDataSource(data={'counts':counts, 
                                    'centery' : counts /2,
                                    'centers' : bin_centers, 
                                    'widths' : bin_widths},
                              column_names = ['counts', 'centers', 'widths', 'centery']
    )
    return source

def make_factor_source(series):
    unique_vals = np.unique(series)
    source = ColumnDataSource(data={'factors':unique_vals}, 
                              column_names = ['factors']
    )
    return source

def make_histogram(datasource, counts_name="counts", 
                   centery_name='centery',
                   centers_name="centers", 
                   widths_name="widths", 
                   max=None, min=None,
                   width=500, height=500,
                   min_border=40,
                   ):
                   

    """Convenience function to make a histogram out of the output
    of make_histogram_source
    Args:
        datasource(ColumnDataSource) : source data
        counts_name(str, optional) : name of column that has count information
        centery_name(str, optional) : name of column that has counts/2.. hacky
        widths_name(str, optional) : name of column with widths
        centers_name(str, optional) : name of columns with centers
        max(number) : max val of underlying data (used for x axis domain)
        min(number) : min val of underlying data (used for x axis domain)    
    """
    if max is None:
        end = np.max(datasource.data[centers_name])
    if min is None:
        start = np.min(datasource.data[centers_name])
    top = np.max(datasource.data[counts_name])
    plot = rect(centers_name, centery_name, widths_name, counts_name,
                title=" " ,
                plot_width=width, plot_height=height,
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
    
    
    
