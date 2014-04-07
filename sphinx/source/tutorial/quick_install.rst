
.. _quick_install:

Quick Install
=============

This section gives details about how to obtain and install Bokeh for running
the tutorial exercises. For full installation instructions, see :ref:`installation`.

Dependencies
------------

Because the Bokeh client library is mostly concerned with providing a nice
Python interface for generating JSON objects which are then consumed by the
BokehJS library running in the browser, there shouldn't be a *hard* dependency
on any of the standard NumPy/SciPy stack.  It is entirely possible to use Bokeh with
plain Python lists of values.

The Bokeh plot server does take advantage of NumPy, and may have a hard
dependency on several compiled libraries.

Ideally, you should have the following libraries installed:

 * NumPy
 * Flask
 * Redis
 * Requests
 * gevent
 * gevent-websocket
 * Pandas

These are best obtained via the `Anaconda Python Distribution <http://continuum.io/anaconda>`_,
which was designed to include robust versions of popular libraries for
the Python scientific and data analysis stacks.

Installing
----------

If you are already an Anaconda users, you should be able to run the command:
::

    $ conda install bokeh

This will install the most recent published Bokeh release from the
`Continuum Analytics <http://continuum.io>`_ Anaconda repository, along with all
dependencies. This will also install the examples into the ``examples/`` subdirectory
of your Anaconda installation directory.

Alternatively, if you are confident you have dependencies like NumPy, Pandas, and
Redis installed, then you can use ``pip``:
::

    $ pip install bokeh

This will not install any examples, and you will need to clone the git
repository and look in the ``examples/`` directory there.
