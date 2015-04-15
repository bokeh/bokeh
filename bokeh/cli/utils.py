from __future__ import absolute_import, print_function

from collections import OrderedDict
from six.moves.urllib import request as urllib2
import io
import pandas as pd
from .. import charts
from . import help_messages as hm


def keep_source_input_sync(filepath, callback, start=0):
    """ Monitor file at filepath checking for new lines (similar to
    tail -f) and calls callback on every new line found.

    Args:
        filepath (str): path to the series data file (
            i.e.: /source/to/my/data.csv)
        callback (callable): function to be called with the a DataFrame
            created from the new lines found from file at filepath
            starting byte start
        start (int): specifies where to start reading from the file at
            filepath.
            Default: 0

    Returns:
        DataFrame created from data read from filepath
    """
    if filepath is None:
        msg = "No Input! Please specify --source_filename or --buffer t"
        raise IOError(msg)

    if filepath.lower().startswith('http'):
        # Create a request for the given URL.

        while True:
            request = urllib2.Request(filepath)
            data = get_data_from_url(request, start)

            f = io.BytesIO(data)
            f.seek(start)
            line = f.readline()     # See note below

            if not line:
                continue   # No data, try again

            callback(line)
            start = len(data)
    else:
        f = open(filepath, 'r')
        f.seek(start)
        while True:
            line = f.readline()     # See note below
            if not line:
                continue   # No data, try again
            callback(line)

    source = pd.read_csv(filepath)
    return source

# Try to get the response. This will raise a urllib2.URLError if there is a
# problem (e.g., invalid URL).
# Reference:
# - http://stackoverflow.com/questions/5209087/python-seek-in-http-response-stream
# - http://stackoverflow.com/questions/1971240/python-seek-on-remote-file-using-http
def get_data_from_url(request, start=0, length=0):
    """ Read from request after adding headers to retrieve data from byte
    specified in start.

    request (urllib2.Request): request object related to the data to read
    start (int, optional): byte to start reading from.
        Default: 0
    length: length of the data range to read from start. If 0 it reads
        until the end of the stream.
        Default: 0

    Returns:
        String read from request
    """
    # Add the header to specify the range to download.
    if start and length:
        request.add_header("Range", "bytes=%d-%d" % (start, start + length - 1))
    elif start:
        request.add_header("Range", "bytes=%s-" % start)

    response = urllib2.urlopen(request)
    # If a content-range header is present, partial retrieval worked.
    if "content-range" in response.headers:
        print("Partial retrieval successful.")

        # The header contains the string 'bytes', followed by a space, then the
        # range in the format 'start-end', followed by a slash and then the total
        # size of the page (or an asterix if the total size is unknown). Lets get
        # the range and total size from this.
        _range, total = response.headers['content-range'].split(' ')[-1].split('/')
        # Print a message giving the range information.
        if total == '*':
            print("Bytes %s of an unknown total were retrieved." % _range)
        else:
            print("Bytes %s of a total of %s were retrieved." % (_range, total))

    # # No header, so partial retrieval was unsuccessful.
    # else:
    #     print "Unable to use partial retrieval."
    data = response.read()

    return data

def parse_output_config(output):
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

    Returns:
        dictionary containing the output arguments to pass to a chart object
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


def get_chart_params(title, output, show_legend=False):
    """Parse output type and output options and return related chart
    parameters. For example: returns filename if output_type is file
    or server it output_type is server

    Args:
        title (str): the title of your plot.
        output (str): selected output. Follows the following convention:
            <output_type>://<type_arg> where output_type can be
            `file` (in that case type_arg specifies the file path) or
            `server` (in that case type_arg specify the server name).


    Returns:
        dictionary containing the arguments to pass to a chart object
        related to title and output options
    """
    params = {'title': title, 'legend': show_legend}
    output_params = parse_output_config(output)
    if output_params:
        params.update(output_params)

    return params


def get_data_series(series, source, indexes):
    """Generate an OrderedDict from the source series excluding index
    and all series not specified in series.

    Args:
        series (list(str)): list of strings specifying the names of the
            series to keep from source
        source (DataFrame): pandas DataFrame with the data series to be
            plotted
        indexes (lst(str)): name of the series of source to be used as index.

    Returns:
        OrderedDict with the data series from source
    """
    series = define_series(series, source, indexes)
    # generate charts data
    data_series = OrderedDict()
    for i, colname in enumerate(series+indexes):
        try:
            data_series[colname] = source[colname]
        except KeyError:
            raise KeyError(hm.ERR_MSG_SERIES_NOT_FOUND % (colname, source.keys()))

    return data_series


def define_series(series, source, indexes):
    """If series is empty returns source_columns excluding the column
    where column == index. Otherwise returns the series.split(',')

    Args:
        series (str): string that contains the names of the
            series to keep from source, separated by `,`
        source (DataFrame): pandas DataFrame with the data series to be
            plotted
        indexes (lst(str)): name of the series of source to be used as index.

    Returns:
        list of the names (as str) of the series except index
    """
    if not series:
        return [c for c in source.columns if c not in indexes]
    else:
        return series.split(',')


def get_charts_mapping():
    """Return a dict with chart classes names (lower case) as keys and
    their related class as values.

    Returns:
        dict mapping chart classes names to chart classes
    """
    mapping = {}
    for (clsname, cls) in charts.__dict__.items():
        try:
            # TODO: We may need to restore the objects filtering
            # when charts creators (or builders registration) is added
            # to the charts API
            mapping[clsname.lower()] = cls
        except TypeError:
            pass
    return mapping
