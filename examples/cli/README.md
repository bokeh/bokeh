This folder contains a few examples on how to use Bokeh Command Line
Tool (CLI).

To run the examples you first have to start the bokeh-server, ie.,

    bokeh-server --backend=memory

and cd into the examples/cli folder.

stream_netfond.sh
-----------------

Shows how to use the CLI to stream data into bokeh-server from an url.
It uses CLI `sync-with-source` option to force the tool to keep
streaming new data into bokeh-server creating an animated plot.

Usage:

on unix:

$ sh stream_netfond.sh

on windows:

$ stream_netfond.bat


