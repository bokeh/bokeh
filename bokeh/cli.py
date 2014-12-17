from __future__ import print_function

import time
import sys
from six.moves import cStringIO as StringIO

from collections import OrderedDict

import numpy as np
import pandas as pd
import bokeh.charts as bc
from bokeh.palettes import brewer
import pdb
import click

ERR_MSG_TEMPL = "##### ERRORS OCCURRED! #####\n" \
                "An error occurred while building the Chart. No series filtering" \
                " specified (using all series found: %s. " \
                "If you have series with non numeric data (like " \
                "timestamps or text) this is causing the problem. Be sure to " \
                "only specify numeric series using the --series argument.\n\n" \
                "Error details:\n"

# Define a mapping to connect chart types supported arguments and chart classes
CHARTS_MAP = {}
for (clsname, cls) in bc.__dict__.items():
    try:
        if issubclass(cls, bc.ChartObject):
            CHARTS_MAP[clsname.lower()] = cls

    except TypeError:
        pass

palettes = u', '.join(sorted(brewer.keys()))

help = u"""Colors palette to use. The following palettes are available:

%s


You can also provide your own custom palette by specifying a list colors. I.e.:

"#a50026,#d73027,#f46d43,#fdae61,#fee08b,#ffffbf,#d9ef8b,#a6d96a,#66bd63"


""" % palettes

@click.command()
@click.option('--input', default=None,
              help='path to the series data file (i.e.: /source/to/my/data.csv')
@click.option('--output', default='file://cli_output.html',
    help='''Selects the plotting output, which could either be sent to an html '''
         '''file or a bokeh server instance. Syntax convention for this option '''
         '''is as follows: <output_type>://<type_arg>

        where:
          - output_type: 'file' or 'server'
          - 'file' type options: path_to_output_file
          - 'server' type options syntax: docname[@url][@name]

        Defaults to: --output file://cli_output.html

        Examples:
            --output file://cli_output.html
            --output file:///home/someuser/bokeh_rocks/cli_output.html
            --output server://clidemo

         '''
)
@click.option('--title', default='Bokeh CLI')
@click.option('--plot_type', default='Line')
@click.option(
    '--index', default='',
    help="Name of the data series to be used as index when plotting. By "
         "default the first series found on the input file is taken."
)
@click.option(
    '--tools', default='pan,wheel_zoom,box_zoom,reset,previewsave,hover',
)
@click.option(
    '--series', default='',
    help="Name of the series from the source to include in the plot. "
         "If not specified all source series will be included."
)
@click.option('--palette', default="RdYlGn", help=help)
@click.option(
    '--buffer', default='f',
    help="""Reads data source as String from input buffer. Usage example:
     cat stocks_data.csv | python cli.py --buffer t
    """
)
@click.option('--sync_with_source', default=False)
def cli(input, output, title, plot_type, tools, series, palette,
        index, buffer, sync_with_source):
    """Bokeh Command Line Tool is a minimal client to access high level plotting
    functionality provided by bokeh.charts API.

    Examples:

    >> python bokeh-cli.py --title "My Nice Plot" --series "High,Low,Close"
    --plot_type "circle,line" --palette Reds --input sample_data/stocks_data.csv

    >> cat sample_data/stocks_data.csv | python bokeh-cli.py --buffer t

    >> python bokeh-cli.py --help
    """
    source = get_input(input, buffer)
    # get the charts specified by the user
    factories = create_chart_factories(plot_type)

    if palette:
        print ("Sorry, custom palettes not supported yet, coming soon!")
    if tools:
        print ("Sorry, custom tools not supported yet, coming soon!")

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

def define_series(series, source, index):
    """If series is empty returns source_columns excluding the column
    where column == index. Otherwise returns the series.split(',')

    Args:
        series (str): string that contains the names of the
            series to keep from source, separated by `,`
        source (DataFrame): pandas DataFrame with the data series to be
            plotted
        index (str): name of the series of source to be used as index.
    """
    if not series:
        return [c for c in source.columns if c != index]
    else:
        return series.split(',')

def get_data_series(series, source, index):
    """Generate an OrderedDict from the source series excluding index
    and all series not specified in series.

    Args:
        series (list(str)): list of strings specifying the names of the
            series to keep from source
        source (DataFrame): pandas DataFrame with the data series to be
            plotted
        index (str): name of the series of source to be used as index.
    """
    series = filter_series(series, index, source)
    # generate charts data
    data_series = OrderedDict()
    for i, colname in enumerate(series+[index]):
        data_series[colname] = source[colname]

    return data_series

def parse_output(output):
    """Parse the output specification string and return the related chart
    output attribute.

    Attr:
        output (str): String with the syntax convention specified for the
            cli output option is as follows: <output_type>://<type_arg>
            Valid values:
                output_type: file or server
                type_arg:
                    file_path if output_type is file
                    serve path if output_type is server
    """
    output_type, output_options = output.split('://')

    if output_type == 'file':
        return {'filename': output_options}

    elif output_type == 'server':
        # TODO: check if server configuration is as flexible as with plotting
        #       interface and add support for url/name if so.
        out_opt = output_options.split("@")
        attrnames = ['server', 'url', 'name']

        # unpack server output parametrs in order to pass them to the plot
        # creation function
        kws = dict((attrn, val) for attrn, val in zip( attrnames, out_opt))
        return {'server': kws['server']}

    else:
        msg = "Unknown output type %s found. Please use: file|server"
        print (msg % output_type)
        return {}

def get_chart_params(title, output):
    """Parse output type and output options and return related chart
    parameters. For example: returns filename if output_type is file
    or server it output_type is server

    Args:
        title (str): the title of your plot.
        output (str): selected output. Follows the following convention:
            <output_type>://<type_arg> where output_type can be
            `file` (in that case type_arg specifies the file path) or
            `server` (in that case type_arg specify the server name).

    """
    params = {'title': title}
    output_params = parse_output(output)
    if output_params:
        params.update(output_params)

    return params

def get_input(filepath, buffer):
    """Parse received input options. If buffer is not false (=='f') if
    gets input data from input buffer othewise opens file specified in
    sourcefilename,

    Args:
        filepath (str): path to the file to read from to retrieve data
        buffer (str): if == 't' reads data from input buffer
    """
    if buffer != 'f':
        filepath = StringIO(sys.stdin.read())
    elif filepath is None:
        msg = "No Input! Please specify --source_filename or --buffer t"
        raise IOError(msg)

    source = pd.read_csv(filepath)
    return source

if __name__ == '__main__':
    cli()




