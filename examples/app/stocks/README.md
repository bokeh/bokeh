Create a simple stocks correlation dashboard.

Sample Data
===========

To run the stocks applet example, you first need to download a sample data
file. A python script is included in the applet's directory to collect and
extract the data, which can be run directly from the directory:

    python download_sample_data.py

This should be all that is necessary.

In case the above script does not work, the file can be downloaded
manually from this location:

    http://quantquote.com/files/quantquote_daily_sp500_83986.zip

Once the file is downloaded, move it to this directory and unzip it. Unzip
the file by clicking on it (in Windows), or by executing this command from
the command line:

    unzip quantquote_daily_sp500_83986.zip

This will leave a 'quantquote_daily_sp500_83986' subdirectory in this
directory. Finally, move the 'daily' directory by executing this command
from the command line:

    mv quantquote_daily_sp500_83986/daily .

Running
=======

Bokeh Server
------------

To view this applet directly from a bokeh server, you simply need to run a
bokeh server and point it at the stock example directory. For example, from
this directory, you can run:

    bokeh serve .

Or from one directory level up, you can run:

    bokeh serve stocks

Now navigate to the following URL in a browser:

    http://localhost:5006/stocks
