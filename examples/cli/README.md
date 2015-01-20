This folder contains a few examples on how to use Bokeh Command Line
Tool (CLI).

.. warning::
        The ``CLI Tool`` is experimental and in early alpha status! Please
        take this into account when using it.


Examples are saved as bash scripts and are self contained. To run the
examples you need to cd into the examples/cli folder.

stream_netfond.sh
-----------------

Shows how to use the CLI to stream data into bokeh-server from an url.
It uses CLI `sync-with-source` option to force the tool to keep
streaming new data into bokeh-server creating an animated plot.

Usage:

$ sh stream_netfond.sh


stream_sys_stats_to_file.sh
---------------------------

Shows how to use the CLI to stream data into bokeh-server from a
local file. The script launches a python script that writes cpu
and memory data to a file and an instance of bokeh-server.
It uses CLI `sync-with-source` option to force the tool to keep
streaming new data into bokeh-server creating an animated plot.

Usage:

$ sh stream_sys_stats_to_file.sh
$ sh stream_sys_stats_to_file.sh --legend
$ sh stream_sys_stats_to_file.sh --legend --update_ranges
$ sh stream_sys_stats_to_file.sh --legend --update_ranges --window_size 20


stream_tweets.sh
----------------

Shows how to use the CLI to stream data into bokeh-server from a
local file. The script launches a python script that writes
simulated geotagget tweets data to a file and an instance of
bokeh-server.
It uses CLI `sync-with-source` option to force the tool to keep
streaming new data into bokeh-server creating an animated scatter
chart.

Usage:

$ sh sh stream_tweets.sh


stream_tweets_gmap_file.sh
--------------------------

Shows how to use the CLI to build a charts composition adding
GMap and Scatter charts to the same figure.

Usage:

$ sh stream_tweets_gmap_file.sh


tweets_smart_filters.sh
--------------------------

Shows how to use the CLI filtering and selection functionality
to interact with a chart. The user can select points of the
created scatter chart and hit the "copy selection" button to
copy selected data to the clipboard

Usage:

$ sh tweets_smart_filters.sh
