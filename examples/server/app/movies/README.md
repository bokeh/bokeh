# Movies Example

Create an interactive query and visualization dashboard for a set of movie data.

*Inspired by the [Shiny Movie Explorer](https://shiny.rstudio.com/gallery/movie-explorer.html).*

<img src="https://static.bokeh.org/movies.png" width="80%"></img>

## Setting Up

This demo requires Bokeh sample data sets to be installed. From the command
line, execute following command:

    pip install bokeh_sampledata

All the necessary data files will be downloaded to a subfolder in your home
directory.

Additionally, this demo requires the [Pandas](http://pandas.pydata.org/) library
in order to run. To install Pandas using conda, execute the command:

    conda install pandas

To install using pip, execute the command:

    pip install pandas

## Running

To view the app directly from a Bokeh server, navigate to the parent directory
[`examples/server/app`](https://github.com/bokeh/bokeh/blob/-/examples/server/app), and
execute the command:

    bokeh serve --show movies
