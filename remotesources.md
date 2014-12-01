### Remote Data Sources
This is a discussion of how Bokeh should integrate with remote data sources

-  Hosted on a blaze server (possibly integrate one into the bokeh server via a flask blueprint)
-  Served up via some AJAX endpoint

The scope of this dicussion is to support

-  streaming pdates
-  abstract rendering
-  streaming updating plots without need for the Bokeh Server

With special consideration for to implement

-  linked brushing/selections for remote data sources
-  linked brushing/selections for remote data sources, when abstract rendering is in play
-  incremental updates for streaming data sets

### Issues
#### Bokeh APIs

-  It would be nice if all Bokeh APIs by default supported remote data sources as drop in replacements for
ColumnDataSources

-  This is tricky, because some of the more sophisticated Bokeh APIs require pre-processing of the data
in order to determine what plots to construct (Bokeh.charts) i.e. computing histograms, Facetting data
to create grid plots, computing max/mins for determine various bounds

-  If the data volume is small, this is we can probably fetch a copy of the data, and process it.  If the
data is large, we probably require it to be in blaze, since that will be the strategy for AR going forward.
Then we assume whatever computations are done on the dataset in the bokeh python code  can be done in blaze

-  This also suggests that blaze should be a bokeh dependency - of course this gets a bit tricky because
bokeh is pip installable, and blaze isn't really

#### Data Model

-  What is the proper model for using a remote data source?  The previous approach I advocated was
subclassing DataSource, and adding a javascript update method which would query for the new data.
However this gets tricky - In the bokeh pattern of sharing objects in order to express relationships,
What if you created a line plot using abstract rendering, as well as a scatter plot using abstract rendering.
The abstract rendering server would return a downsampled line for the line plot, and a downsampled image
for the scatter plot.  Sharing the same javascript object for this would result in both representations
stomping on each other

-  The previous approach, was to detect a remote data source, and create a dummy ColumnDataSource for each
renderer.  This is fine but it means that all bokeh plotting APIs need to use this functionality

-  There is an incompatability with server data sources and Backbone REST API.  Backbone assumes that the
server is returning it's copy of the object whenever you do an update, so Backbone synchronization is really
a state reconciliation.  However for remote data sources, we don't actually persist the data. in the bokeh server,
so whenever we go to save the datasource(for example, in response to a selection)  the server sends
it's copy of the data source(which contains no data) and that wipes out the copy we got from an ajax endpoint

#### Selections

-  Bokeh supports linking selections across renderers by sharing the same data source object.  Bokeh also
supports (or will) an explicit link command, to link selections across different data sources.
For ColumnDataSources, rendering selecitons is fairly straight forward, because we have access to
the entire dataset in the clien.  What should happen for remote data sources?
  -  We could filter the data out for remote data sources when it comes to selection
  -  We could continue to send the entire dataset, and use selections on the client side to render selection and
  non selection glyphs
  -  What about for abstract rendering - Does the abstract rendering function now need to understand
  how to render selection and non-selection glyphs?

#### Streaming

-  I think that Blaze should support some sort of streaming protocol (that other ajax sources could implement if they want
-  I do not think we should try to do streaming with the column data source because we have to create copies of the
bokeh object graph in order to create applications, or in order to publish the plot.  And there is no way to update the
disparate copies
-  Possibly we do something in blaze where the blaze server (or some bokeh wrapper around the blaze server)
returns a sequence number, and the datasource can be configured to poll (Sending the latest sequence number)
