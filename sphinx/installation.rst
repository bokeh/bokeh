
.. _installation:

Installation
============

This section gives more details about the installation process of Bokeh,
for those who were unable to complete the process detailed in the
:ref:`quickstart`, or who want more information about the process.

Dependencies
------------

Because the Bokeh client library is mostly concerned with providing a nice
Python interface for generating JSON objects which are then consumed by the
BokehJS library running in the browser, there shouldn't be a *hard* dependency
on any of the standard Numpy/Scipy stack.  It is entirely possible to use Bokeh with
plain Python lists of values.

The Bokeh plot server does take advantage of Numpy, and may have a hard
dependency on several compiled libraries.

Ideally, you should have the following libraries installed:

 * Numpy
 * Flask
 * Redis
 * Requests
 * gevent
 * gevent-websocket
 * Pandas

These are best obtained via the `Anaconda Python Distribution <http://continuum.io/Anaconda>`_,
which was designed to include robust versions of popular libraries for
the Python scientific and data analysis stacks.

If you are already an Anaconda users, you should be able to run the command:
::

    $ conda install bokeh

This will install the most recent published Bokeh release from the
`Continuum Analytics <http://continuum.io>`_ Anaconda repository, along with all
dependencies.

If you are not using Anaconda, and you are using Windows, installing `redis <http://redis.io>`_
may be challenging.  We recommend grabbing them from here: 
`https://github.com/dmajkic/redis/downloads <https://github.com/dmajkic/redis/downloads>`_.

Installing from Source
----------------------

You can also clone the
`Bokeh Github repository <https://github.com/ContinuumIO/bokeh>`_:
::

    $ git clone https://github.com/ContinuumIO/bokeh
    $ cd bokeh
    $ python setup.py

The setup.py script will automatically install the pre-built Javascript
for the runtime :ref:`bokehjs` library, so you do not need Coffeescript
or any Javascript development infrastructure to use Bokeh.

If these instructions don't work, or you are not sure how to install the
various dependencies, please consults the :ref:`developer_install` section
of the :ref:`devguide`.




