# Crossfilter Example

Create a Bokeh application that shows how different facets of data in a
[Pandas](https://pandas.pydata.org) DataFrame can be plotted against one
another.

<img src="https://static.bokeh.org/crossfilter.png" width="80%"></img>

## Setting Up

This demo requires the [Pandas](https://pandas.pydata.org) package in order to
run. To install Pandas using conda, execute the command:

    conda install pandas

To install using pip, execute the command:

    pip install pandas

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/server/app`](https://github.com/bokeh/bokeh/blob/-/examples/server/app),
and execute the command:

    bokeh serve --show crossfilter
