# Gapminder Example

Create an example that reproduces the famous "Gapminder" data visualization from
[Hans Rosling's TED Talk](https://www.ted.com/talks/hans_rosling_the_best_stats_you_ve_ever_seen).

<img src="https://static.bokeh.org/gapminder.png" width="80%"></img>

## Setting Up

This demo requires Bokeh sample data sets to be installed. From the command
line, execute following command:

    pip install bokeh_sampledata

All the necessary data files will be downloaded to a subfolder in your home
directory.

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/server/app`](https://github.com/bokeh/bokeh/blob/-/examples/server/app),
and execute the command:

    bokeh serve --show gapminder
