Create an interactive query and visualization dashboard for a set of
IMDB movie data. Inspired by the [Shiny Movie Explorer](http://shiny.rstudio.com/gallery/movie-explorer.html).

#### Setting Up

This demo requires Bokeh sample data sets to be installed. From the
command line, execute:

    python -c "import bokeh.sampledata; bokeh.sampledata.download()"

And all the necessary data files will be downloaded to a subfolder in
your home directory.

Additionally, this demo requires the [pandas](http://pandas.pydata.org/)  library
in order to run. To install pandas using conda, execute the command:

    conda install pandas

To install using pip, execute the command:

    pip install pandas

#### Running

To view the app directly from a Bokeh server, navigate to the parent
directory [`examples/app`](https://github.com/bokeh/bokeh/tree/master/examples/app),
and execute the command:

    bokeh serve --show movies
