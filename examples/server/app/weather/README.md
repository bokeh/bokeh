# Weather Examples

Create an example shows the daily record, average, and actual temperatures for
three cities (Austin, Boston, Seattle) in 2015. The default view includes a
discrete graph of the temperatures, but a smoothed representation can also be
chosen.

<img src="https://static.bokeh.org/weather.png" width="80%"></img>

## Setting Up

This demo requires the Pandas and Scipy packages in order to run. To install using
conda, execute the command:

    conda install pandas
    conda install scipy

To install using pip, execute the command:

    pip install pandas
    pip install scipy

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/app`](https://github.com/bokeh/bokeh/tree/master/examples/app),
and execute the command:

    bokeh serve --show weather
