
.. _installation:

Installation
############

.. contents::
    :local:
    :depth: 2

This section gives more details about the installation process of Bokeh,
for those who were unable to complete the process detailed in the
:ref:`quickstart`, or who want more information about the process.

.. _install_dependencies:

Dependencies
============

Because the Bokeh client library is mostly concerned with providing a nice
Python interface for generating JSON objects which are then consumed by the
BokehJS library running in the browser, there shouldn't be a *hard* dependency
on any of the standard NumPy/SciPy stack.  It is entirely possible to use
Bokeh with plain Python lists of values.

The Bokeh plot server does take advantage of NumPy, and may have a hard
dependency on several compiled libraries.

Ideally, you should have the following libraries installed:

.. hlist::
    :columns: 3

    * NumPy
    * Pandas
    * Flask
    * Jinja2
    * Redis
    * Redis-py
    * Six
    * Requests
    * Tornado >= 4.0
    * Werkzeug
    * MarkupSafe
    * Greenlet
    * PyZMQ
    * PyYaml
    * DateUtil

.. _install_packages:

Package Installs
================

These Bokeh dependencies are best obtained via the
`Anaconda Python Distribution`_, which was designed to include robust
versions of popular libraries for the Python scientific and data analysis
stacks.

If you are already an Anaconda user, you can simply run the command::

    $ conda install bokeh

This will install the most recent published Bokeh release from the
`Continuum Analytics`_ Anaconda repository, along with all dependencies.

Alternatively, it is possible to install from PyPI using ``pip``::

    $ pip install bokeh

.. _install_sampledata:

Sample Data
===========

Some of the Bokeh examples rely on sample data that is not included in the
Bokeh GitHub repository or released packages, due to their size. Once Bokeh
is installed, the sample data can be obtained by executing the following
commands at a python prompt::

    >>> import bokeh.sampledata
    >>> bokeh.sampledata.download()

Or directly from a Bash or Windows comand prompt:

.. code-block:: sh

    python -c "import bokeh.sampledata; bokeh.sampledata.download()"

.. _install_windows:

Notes for Windows Users
=======================

If you are using Windows then installing `redis`_ may be challenging. On
Windows the Bokeh plot server defaults to an in-memory (non-persistent)
storage backend.

If you would like to try using the Redis backend, we recommend grabbing
the binaries from one of these locations:

* https://github.com/dmajkic/redis/downloads
* http://cloud.github.com/downloads/rgl/redis/redis-2.4.6-setup-64-bit.exe

Once installed, you should add ``C:\Program Files\Redis`` to your ``PATH``
variable, and execute run the Bokeh server as follows::

    $ bokeh-server --backend=redis

.. _install_source:

Installing from Source
======================

Installing Bokeh from source requires rebuilding the BokehJS library
from its CoffeeScript sources. Some additional toolchain support is required.
Please consult the :ref:`devguide_building` section of the :ref:`devguide` for
more detailed instructions.

.. _install_devbuild:

Developer Builds
================

And easier way to obtain the most recent Bokeh updates without having to worry
about building Bokeh yourself is to install a developer build. We typically try
to make a new developer build available at least once a week, and sometimes more
often.

These builds are being made available on `binstar.org`_. If you are using
Anaconda, you can install with conda by issuing the command::

    conda install -c bokeh/channel/dev bokeh

Alternatively you can install with pip::

    pip install --pre -i https://pypi.binstar.org/bokeh/channel/dev/simple bokeh --extra-index-url https://pypi.python.org/simple/

We attempt to make sure the developer builds are relatively stable, however please
be aware they they are not tested as rigorously as standard releases. Any problems
or issues reported on the GitHub issue tracker are appreciated.

.. _install_bokehjs:

BokehJS Standalone
==================

If you would like to use BokehJS as a standalone JavaScript library, there are
two easy ways to get any published release.

First, released versions of BokehJS is available for download from CDN at
pydata.org, under the following naming scheme::

    http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.js

for the BokehJS JavaScript, and::

    http://cdn.pydata.org/bokeh/release/bokeh-x.y.z.min.css

for the BokehJS CSS.

As a concrete example, the links for version ``0.8.1`` are:

* http://cdn.pydata.org/bokeh/release/bokeh-0.8.1.min.css
* http://cdn.pydata.org/bokeh/release/bokeh-0.8.1.min.css

Alternatively, BokehJS is available from `npmjs`_ through the Node Package
Manager::

    $ npm install bokehjs

.. _Anaconda Python Distribution: http://continuum.io/anaconda
.. _binstar.org: http://binstar.org
.. _Continuum Analytics: http://continuum.io
.. _npmjs: https://www.npmjs.org/package/bokehjs
.. _redis: http://redis.io
