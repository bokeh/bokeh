from __future__ import print_function

from six.moves.urllib import request as urllib2
from six.moves import cStringIO as StringIO
import pandas as pd
import click

from .help_messages import *
from .utils import (get_chart_params, get_charts_mapping,
                    get_data_series, keep_source_input_sync, get_data_from_url)
from .. import charts as bc

# Define a mapping to connect chart types supported arguments and chart classes
CHARTS_MAP = get_charts_mapping()

@click.command()
@click.option('--input', default=None,help=HELP_INPUT)
@click.option('--output', default='file://cli_output.html', help=HELP_OUTPUT)
@click.option('--title', default='Bokeh CLI')
@click.option('--plot_type', default='Line')
@click.option('--index', default='', help=HELP_INDEX)
@click.option('--series', default='', help=HELP_SERIES)
@click.option('--palette')
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
    cli = CLI(
        input, output, title, plot_type, series, palette, index, buffer,
        sync_with_source
    )
    cli.run()


class CLI(object):
    """This is the Bokeh Command Line Interface class and it is in
    charge of providing a very high level access to bokeh charts and
    extends it with functionality.

    """
    def __init__(self, input_source, output, title, plot_type, series, palette,
                 index, buffer, sync_with_source):
        """Args:
        input_source (str): path to the series data file (i.e.:
            /source/to/my/data.csv)
            NOTE: this can be either a path to a local file or an url
        output (str, optional): Selects the plotting output, which
            could either be sent to an html file or a bokeh server
            instance. Syntax convention for this option is as follows:
            <output_type>://<type_arg>

            where:
              - output_type: 'file' or 'server'
              - 'file' type options: path_to_output_file
              - 'server' type options syntax: docname[@url][@name]

            Defaults to: --output file://cli_output.html

            Examples:
                --output file://cli_output.html
                --output file:///home/someuser/bokeh_rocks/cli_output.html
                --output server://clidemo

            Default: file://cli_output.html.
        title (str, optional): the title of your chart.
            Default: None.
        plot_type (str, optional): charts classes to use to consume and
            render the input data.
            Default: Line.
        series (str, optional): Name of the series from the input source
            to include in the plot. If not specified all source series
            will be included.
            Defaults to None.
        palette (str, optional): name of the colors palette to use.
            Default: None.
        index (str, optional): Name of the data series to be used as index
            when plotting. By default the first series found on the input
            file is taken
            Default: None
        buffer (str, optional): if is `t` reads data source as string from
            input buffer using StringIO(sys.stdin.read()) instead of
            reading from a file or an url.
            Default: "f"
        sync_with_source (bool, optional): if True keep the charts source
            created on bokeh-server sync'ed with the source acting like
            `tail -f`.
            Default: False


        Attributes:
            source (obj): datasource object for the created chart.
            chart (obj): created chart object.
        """
        self.input = input_source
        self.series = series
        self.index = index
        self.last_byte = -1
        self.sync_with_source = sync_with_source

        self.source = self.get_input(input_source, buffer)
        # get the charts specified by the user
        self.factories = create_chart_factories(plot_type)

        if palette:
            print ("Sorry, custom palettes not supported yet, coming soon!")

        # define charts init parameters specified from cmd line and create chart
        self.chart_args = get_chart_params(title, output)

    def run(self):
        """ Start the CLI logic creating the input source, data conversions,
        chart instances to show and all other niceties provided by CLI
        """
        try:
            self.chart = create_chart(
                self.series, self.source, self.index, self.factories, **self.chart_args
            )
            self.chart.show()

            self.has_ranged_x_axis = 'ranged_x_axis' in self.source.columns
            self.columns = [c for c in self.source.columns if c != 'ranged_x_axis']

        except TypeError:
            if not self.series:
                series_list = ', '.join(self.chart.values.keys())
                print(ERR_MSG_TEMPL % series_list)
                raise

        if self.sync_with_source:
            print("animating... press ctrl-C to stop")
            keep_source_input_sync(self.input, self.update_source, self.last_byte)

    def update_source(self, new_source):
        """ Update self.chart source with the new data retrieved from
         new_source. It is done by parsing the new source line,
         trasforming it to data to be appended to self.chart source
         updating it on chart.session and actually updating chart.session
         objects.

        Args:
            new_source (str): string that contains the new source row to
                read to the current chart source.
        """
        ns = pd.read_csv(StringIO(new_source), names=self.columns)
        len_source = len(self.source)

        if self.has_ranged_x_axis:
            ns['ranged_x_axis'] = [len_source]
            self.index = 'ranged_x_axis'

        ns.index = [len_source]
        self.source = pd.concat([self.source, ns])

        _c = create_chart(self.series, ns, self.index, self.factories, **self.chart_args)
        _c._setup_show()
        _c._prepare_show()
        _c._show_teardown()

        for k, v in _c.source.data.items():
            self.chart.source.data[k] = list(self.chart.source.data[k]) + list(v)

        chart = self.chart.chart
        plot = chart.plot
        plot.y_range.end = max(
            plot.y_range.end, _c.chart.plot.y_range.end
        )
        plot.y_range.start = min(
            plot.y_range.start, _c.chart.plot.y_range.start
        )
        chart.session.store_objects(self.chart.source)
        chart.session.store_objects(plot)

    def get_input(self, filepath, buffer):
        """Parse received input options. If buffer is not false (=='f') if
        gets input data from input buffer othewise opens file specified in
        sourcefilename,

        Args:
            filepath (str): path to the file to read from to retrieve data
            buffer (str): if == 't' reads data from input buffer

        Returns:
            string read from filepath/buffer
        """

        if buffer != 'f':
            filepath = StringIO(sys.stdin.read())
        elif filepath is None:
            msg = "No Input! Please specify --source_filename or --buffer t"
            raise IOError(msg)
        else:
            if filepath.lower().startswith('http'):
                # Create a request for the given URL.
                request = urllib2.Request(filepath)
                data = get_data_from_url(request)
                self.last_byte = len(data)

            else:
                filepath = open(filepath, 'r').read()
                self.last_byte = len(filepath)
                filepath = StringIO(filepath)

        source = pd.read_csv(filepath)
        return source


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





