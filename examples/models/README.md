This directory contains examples that use the lowest-level
[`bokeh.models`](http://bokeh.pydata.org/en/latest/docs/user_guide/concepts.html#bokeh-models)
interface. This interface mirrors the models found in the BokehJS browser
library, and provides complete control over every aspect of constructing a
Bokeh document, at the expense of increased verbosity.

Most users will probably want to start off with the higher level
[`bokeh.plotting`](http://bokeh.pydata.org/en/latest/docs/user_guide/plotting.html)
interface,and only selectively use the
[`bokeh.models`](http://bokeh.pydata.org/en/latest/docs/user_guide/concepts.html#bokeh-models)
interface whenever a particular need arises.

#### Examples that use the server

Any examples in this directory whose filenames contain `_animate` or `_server` make use of the Bokeh
server, and you must first start the Bokeh server to view them. To start the server, execute

    bokeh serve

in a separate command window or terminal.
