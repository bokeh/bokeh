from __future__ import absolute_import

from ..palettes import brewer

ERR_MSG_TEMPL = "##### ERRORS OCCURRED! #####\n" \
                "An error occurred while building the Chart. No series filtering" \
                " specified (using all series found: %s. " \
                "If you have series with non numeric data (like " \
                "timestamps or text) this is causing the problem. Be sure to " \
                "only specify numeric series using the --series argument.\n\n" \
                "Error details:\n"
ERR_MSG_SERIES_NOT_FOUND = "%s series not found in source. Available series: %s"

PALETTES = u"""Colors palette to use. The following palettes are available:

%s


You can also provide your own custom palette by specifying a list colors. I.e.:

"#a50026,#d73027,#f46d43,#fdae61,#fee08b,#ffffbf,#d9ef8b,#a6d96a,#66bd63"


""" %  u', '.join(sorted(brewer.keys()))

HELP_INPUT = 'path to the series data file (i.e.: /source/to/my/data.csv'
HELP_OUTPUT = '''Selects the plotting output, which could either be sent to an html
file or a bokeh server instance. Syntax convention for this option
is as follows: <output_type>://<type_arg>

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
HELP_INDEX = "Name of the data series to be used as index when plotting. By " \
             "default the first series found on the input file is taken."
HELP_SERIES = "Name of the series from the source to include in the plot. " \
              "If not specified all source series will be included."
HELP_BUFFER = """Reads data source as String from input buffer. Usage example:
    cat stocks_data.csv | python cli.py --buffer t
"""
HELP_WIN_SIZE = """show up to N values then start dropping off older ones"""
