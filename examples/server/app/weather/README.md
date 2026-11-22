# Weather Examples

Compare daily record, average, and actual temperatures for Chicago, Houston,
Jacksonville, Philadelphia, Phoenix, and Seattle from July 2014 through June
2015. The default view shows daily temperatures. Select **Smoothed** to see
seasonal trends.

## Setting Up

This demo requires pandas, SciPy, and bokeh_sampledata 2026.2 or later.

    pip install pandas scipy bokeh_sampledata

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/server/app`](https://github.com/bokeh/bokeh/blob/-/examples/server/app),
and execute the command:

    bokeh serve --show weather
