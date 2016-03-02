In order to run `flight_delays`, simply use a `bokeh` command.

There are three basic bokeh commands:

The bokeh html command can create standalone HTML documents from any kind of
Bokeh application source: e.g., python scripts, app directories, JSON files,
jupyter notebooks and others. For example:

`bokeh html flight_delays`
The bokeh json command will generate a serialized JSON representation of a
Bokeh document from any kind of Bokeh application source. For example:

`bokeh json flight_delays`
Finally, the bokeh serve command let’s you instantly turn Bokeh documents into
interactive web applications. For example:

`bokeh serve flight_delays`
In all of these cases, the same file can be used without modification
to generate different sorts of output.
