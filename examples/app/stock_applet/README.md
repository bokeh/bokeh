
This example shows how to create a simple applet in Bokeh, which can
be viewed in two different ways:

* running directly on a bokeh-server
* embedded into a separate Flask application

You will need to first download some sample data, then follow the
instructions for running the example.

Sample Data
============

To run the stocks applet example, you first need to download a sample data
file. The file is located at:

    http://quantquote.com/files/quantquote_daily_sp500_83986.zip

You can use a browser to download the file, or depending on your system you
may be able to use curl:

    curl http://quantquote.com/files/quantquote_daily_sp500_83986.zip > quantquote_daily_sp500_83986.zip

or wget:

    wget http://quantquote.com/files/quantquote_daily_sp500_83986.zip

from the command line. Once the file is downloaded you should move it
to this directory, and unzip it. You may be able to unzip the file by
clicking on it, or by executing this command from the command line:

    unzip quantquote_daily_sp500_83986.zip

This should leave a "daily" subdirectory in this directory.

Running
=======

Bokeh Server
------------

To view this applet directly from a bokeh server, you simply need to
run a bokeh-server and point it at the stock example script:

    bokeh-server --script stock_app.py

Now navigate to the following URL in a browser:

    http://localhost:5006/bokeh/stocks

Flask Application
-----------------

To embed this applet into a Flask application, first you need to run
a bokeh-server and point it at the stock example script. In this
directory, execute the command:

    bokeh-server --script stock_app.py

Next you need to run the flask server that embeds the stock applet:

    python flask_server.py

Now you can see the stock correlation applet by navigating to the following
URL in a browser:

    http://localhost:5050/app

