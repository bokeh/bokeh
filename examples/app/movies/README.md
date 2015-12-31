Create an interactive query and visualization dashboard for a set of 
IBMD movie data.

#### Setting Up

This demo requires Bokeh sample data sets to be installed. From the 
command line, execute:

    python -c "import bokeh.sampledata; bokeh.sampledata.download()"

And all the necessary data files will be downloaded to a subfolder in 
your home directory. 

#### Running

To view the apps directly from a Bokeh server, navigate to the parent
directory [`examples/app`](https://github.com/bokeh/bokeh/tree/master/examples/app), 
and execute the command:

    bokeh serve --show movies 
