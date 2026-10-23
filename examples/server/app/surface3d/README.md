# Surface3d Extension Example

This example demonstrates Bokeh custom extensions by wrapping a small
JavaScript library for 3D plotting and connecting it to a Bokeh `IndexedDataSource`.
The renderer consumes logical `x`, `y`, and `z` fields, so it is not coupled to
columnar storage.

<img src="https://static.bokeh.org/surface3d.png" width="80%"></img>

## Setting Up

No additional packages or steps are required to run this example.

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/server/app`](https://github.com/bokeh/bokeh/blob/-/examples/server/app),
and execute the command:

    bokeh serve --show surface3d
