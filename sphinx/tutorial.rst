########
Tutorial
########

.. contents::
    :local:
    :depth: 2


Simple Script-based Plotting
============================

To make a simple plot with Bokeh, just make a small script containing
the following::

    from bokeh.plotting import *
    from numpy import *
    x = linspace(-2*pi, 2*pi, 100)
    y = cos(x)
    output_file("cos.html")
    line(x, y, color="red")
    scatter(x, y, marker="square", color="blue")
    show()

You can find this file in `examples/tutorial1.py` in the Bokeh source tree,
or `on github <https://github.com/ContinuumIO/Bokeh/blob/master/tutorial/tutorial1.py>`_.

Let's look at each line in detail.
::

    from bokeh.plotting import *

This imports a variety of plotting functions from the `plotting` subpackage.
(This is not the only way to construct Bokeh plots, but it will be the most
familiar for those coming from packages like Matplotlib or gnuplot.)
::

    from numpy import *
    x = linspace(-2*pi, 2*pi, 100)
    y = cos(x)

These lines create two NumPy arrays.  Bokeh does not require the use of
NumPy arrays - two Python lists of numbers would have worked just as well -
but it does have special knowledge and handling of NumPy and Pandas data
structures.
::

    output_file("cos.html")

This tells Bokeh to create an HTML file for us.  This file will contain
all the plots we create, as well as the source for BokehJS and its
Javascript dependencies.  Consequently, it can be quite large - over
a megabyte or more.  It is possible to configure the details of HTML
file generation, so that relative links are used.  Please consult
the :ref:`output_file` documentation.

The next two lines create a line plot and a scatter plot:
::

    line(x, y, color="red")
    scatter(x, y, marker="square", color="blue")

Finally, there is a command to save the plot and display it in our
default web browser::

    show()

This should produce the plot shown below:

.. image:: images/tutorial1.png



Using IPython Notebook
======================

Using Bokeh inside an IPython notebook is almost identical to the usage 
above, with one small change::

    output_notebook()

This configures Bokeh for embedding inside IPython notebook sessions.

.. image:: images/notebook_vector.png

Downloading Sample Data
=======================

For more interesting plots than just simple trigonometric curves, Bokeh
comes with a few datasets built in to the :ref:`bokeh.sampledata` module.

Additional data sets may be obtained by executing the following code::

    import bokeh.sampledata
    bokeh.sampledata.download()

By default the sample data sets are downloaded into ``~/.bokeh/data`` but this
setting may be overridden in the ``sampledata_dir`` option of a YAML config file
placed at ``~/.bokeh/config``.  As of version 0.2, this is approximately 12MB of
uncompressed CSV data.

Data sets currently downloaded include:

* CGM.csv - glucose monitoring data
* US_Counties.csv - US counties polygon data
* unemployment09.csv - 2009 US unemployment by county
* various stock data:

  - AAPL.csv
  - FB.csv
  - GOOG.csv
  - IBM.csv
  - MSFT.csv



..
    Plot Server and Embedding
    -------------------------

    Customization
    -------------


