from __future__ import print_function

import time
import numpy as np
import pandas as pd
import click

from .help_messages import *
from .utils import (get_input, get_chart_params, get_charts_mapping,
                    get_data_series)
from .. import charts as bc

# Define a mapping to connect chart types supported arguments and chart classes
CHARTS_MAP = get_charts_mapping()

@click.command()
@click.option('--input', default=None,
              help=HELP_INPUT)
@click.option('--output', default='file://cli_output.html',
    help=HELP_OUTPUT
)
@click.option('--title', default='Bokeh CLI')
@click.option('--plot_type', default='Line')
@click.option('--index', default='', help=HELP_INDEX)
@click.option('--series', default='', help=HELP_SERIES)
@click.option('--palette')#, default="RdYlGn", help=help)
@click.option('--buffer', default='f', help=HELP_BUFFER)
@click.option('--sync_with_source', default=False)
def cli(input, output, title, plot_type, series, palette,
        index, buffer, sync_with_source):
    """Bokeh Command Line Tool is a minimal client to access high level plotting
    functionality provided by bokeh.charts API.

    Examples:

    >> python bokeh-cli.py --title "My Nice Plot" --series "High,Low,Close"
    --plot_type "Line" --palette Reds --input sample_data/stocks_data.csv

    >> cat sample_data/stocks_data.csv | python bokeh-cli.py --buffer t

    >> python bokeh-cli.py --help
    """
    source = get_input(input, buffer)
    # get the charts specified by the user
    factories = create_chart_factories(plot_type)

    if palette:
        print ("Sorry, custom palettes not supported yet, coming soon!")

    # define charts init parameters specified from cmd line and create chart
    args = get_chart_params(title, output)
    chart = create_chart(series, source, index, factories, **args)

    try:
        chart.show()
    except TypeError:
        if not series:
            series_list = ', '.join(chart.values.keys())
            print(ERR_MSG_TEMPL % series_list)
            raise

    if sync_with_source:
        print("\nanimating... press ctrl-C to stop")
        while True:
            try:
                source = pd.read_csv(source_filename)

            except ValueError:
                print("OOOPS, error!")

            _chart = create_chart(series, source, index, x_axis_type, factories, extra)
            _chart._setup_show()
            _chart._prepare_show()
            _chart._show_teardown()
            chart.source.data = _chart.source.data
            chart.chart.session.store_objects(chart.source)
            time.sleep(0.5)

def create_chart(series, source, index, factories, **args):
    """Create charts instances from types specified in factories using
    data series names, source, index and args

    Args:
        series (list(str)): list of strings specifying the names of the
            series to keep from source
        source (DataFrame): pandas DataFrame with the data series to be
            plotted
        index (str): name of the series of source to be used as index.
        factories (list(ChartObject)): list of chart classes to be used
            to create the charts to be plotted
        **args: arguments to pass to the charts when creating them.
    """
    if not index:
        # if no index was specified as for x axis
        # we take a default "range"
        index = 'ranged_x_axis'
        # add the new x range data to the source dataframe
        source[index] = range(len(source[source.columns[0]]))

    data_series = get_data_series(series, source, index)
    # parse queries to create the charts..
    chart_type = factories[0]
    if chart_type == bc.TimeSeries:
        # in case the x axis type is datetime that column must be converted to
        # datetime
        data_series[index] = pd.to_datetime(source[index])

    chart = chart_type(data_series, **args)
    if hasattr(chart, 'index'):
        chart.index = index
    return chart

def create_chart_factories(chart_types):
    """Receive the chart type(s) specified by the user and build a
    list of the their related functions.

    Args:
        series (str): string that contains the name of the
            chart classes to use when creating the chart, separated by `,`

    example:

    >> create_chart_factories('Line,step')
      [Line, Step]
    """
    return [get_chart(name) for name in chart_types.split(',') if name]

def get_chart(class_name):
    """Return the bokeh class specified in class_name.

    Args:
        class_name (str): name of the chart class to return (i.e.: Line|step)
    """
    return CHARTS_MAP[class_name.strip().lower()]

if __name__ == '__main__':
    cli()





